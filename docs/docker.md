# Docker

The `Dockerfile` builds a production image of the server for `linux/amd64` and `linux/arm64`. CI builds it with Docker Bake and publishes it to Docker Hub as [`dndmapp/api-content`](https://hub.docker.com/r/dndmapp/api-content).

## The image

The `Dockerfile` has four stages.

| Stage          | Platform | Purpose                                                                                                  |
|:---------------|:---------|:---------------------------------------------------------------------------------------------------------|
| `pnpm`         | Builder  | The official image of the standalone pnpm binary, which the other stages copy                            |
| `dependencies` | Builder  | Installs the production dependencies with `pnpm install --prod`                                          |
| `build`        | Builder  | Installs every dependency and compiles the application into `dist`                                       |
| `runtime`      | Target   | Copies `package.json`, the production dependencies, `dist`, and the health check script into a new image |

The install and build stages run on the platform of the builder, and the final stage only copies files. A multi-platform build therefore installs and compiles once, and needs no emulation. Every base image is pinned by tag and digest, and Renovate keeps the digests current. It moves the Node.js and pnpm images in the same pull request as `devEngines` in `package.json`.

The image runs `node --enable-source-maps dist/main.js` from `/app` as the unprivileged `node` user, with `NODE_ENV=production`. The files belong to root, so the server can read them but not change them. The source maps ship with the image, so a stack trace points to the TypeScript sources.

The `.dockerignore` file lets only the sources, the health check script, the package manifest, the lockfile, and the compiler configs into the build context. Add a file there when the build needs it, and to the [path filter](#path-filter).

The production dependencies are installed for the builder and copied as they are. That works because none of them holds native code. A future dependency with native code must be installed for `$TARGETPLATFORM` instead, which needs emulation or a runner for each platform.

Keep the `runtime` stage free of `RUN` instructions. CI builds both platforms on a single amd64 runner without QEMU, which works because building the `runtime` stage for arm64 executes nothing on arm64. A `RUN` added there fails the arm64 build with an exec format error, rather than slowing it down silently. Run the command in a stage on the builder and copy its result instead.

## Building

The Bake file, `docker-bake.hcl`, defines two targets. The `default` target builds both platforms with an SBOM and a provenance attestation. The `ci` target inherits from it and adds the GitHub Actions cache for the layers, which needs the runtime token of a workflow run. CI builds `ci`, and a local build runs `default`:

```bash
docker buildx bake
```

It tags the image `dndmapp/api-content:local`. Docker can only load a multi-platform image when it uses the containerd image store, which new installs of Docker Desktop turn on by default.

Build the image for the platform of your machine alone:

```bash
docker build --tag dndmapp/api-content:local .
```

The `Dockerfile` starts with `# check=error=true`, so a violation of the [build checks](https://docs.docker.com/build/checks/) fails the build. Run the checks alone with `pnpm run lint-docker`, which CI runs too.

## Publishing

The composite action in `.github/actions/docker` sets up Buildx, logs in to Docker Hub, and builds the `ci` target with Bake from the checkout of the job. Before the build, `docker/metadata-action` generates the tags of the event, the OCI labels, and the annotations of the image manifests and the index. The `Dockerfile` sets no labels of its own for this reason.

### Tags

| Event                | Tags                                                 | Workflow            |
|:---------------------|:-----------------------------------------------------|:--------------------|
| Pull request         | `pr-<N>`                                             | `pull-request.yaml` |
| Push to `main`       | `edge` and `sha-<short-sha>`                         | `push-main.yaml`    |
| Release tag `vX.Y.Z` | `X.Y.Z`, `X.Y`, and `latest`, plus `X` from 1.0.0 on | `release.yaml`      |

`latest` moves only on releases, and `edge` follows `main`. The bare major tag is left out for `0.y.z` versions, because any 0.x release may break the API.

### Workflows

On a pull request, the `Docker` job runs in parallel with CI, so reviewers get the image sooner. Once the pull request closes, merged or not, the `remove-image-tag` job of `pull-request-closed.yaml` deletes `pr-<N>` through the Docker Hub API. It cancels a build of the pull request that is still running, so the tag cannot come back. Pull requests from forks get no secrets, so both jobs skip them.

On `main`, the `docker` job waits for CI, so `edge` only moves to a commit that passed. A release rebuilds the image at the tag after the CI checks, rather than retagging the build of `main`, so its labels and provenance name the version.

### Path filter

On pull requests and on `main`, a `changes` job runs the composite action in `.github/actions/image-changes` first. The action runs [`dorny/paths-filter`](https://github.com/dorny/paths-filter), and the image job only runs when the change touches one of these paths. Changes to the docs alone build no image. Releases build without the filter.

- The files that `.dockerignore` lets in, without the specs under `src`, which never reach `dist`.
- The `Dockerfile`, `.dockerignore`, and `docker-bake.hcl`.
- The composite actions in `.github/actions/docker` and `.github/actions/image-changes`, and the workflow that runs the job, so a change to the pipeline tests itself.

A pull request compares with its base, so once it touches the image, every later push rebuilds `pr-<N>`. `main` compares each push with the previous one, which for a merge commit covers the whole pull request. When a merge leaves the image alone, `edge` keeps pointing at the last build, and that commit gets no `sha-<short-sha>` tag. Each workflow passes its own path to the action, so add a new path to the filter in the action alone.

### Credentials

The workflows log in with personal access tokens of the `dndmapp` Docker Hub account. Each token has only the scope its job needs. The variable and the secrets live at the level of the GitHub organization.

| Name                     | Kind     | Scope               | Used by                                                 |
|:-------------------------|:---------|:--------------------|:--------------------------------------------------------|
| `DOCKERHUB_USERNAME`     | Variable |                     | Every login, and the namespace of the image             |
| `DOCKERHUB_TOKEN_READ`   | Secret   | `read`              | Nothing yet                                             |
| `DOCKERHUB_TOKEN_WRITE`  | Secret   | `read,write`        | The image jobs of the pull request, `main`, and release |
| `DOCKERHUB_TOKEN_DELETE` | Secret   | `read,write,delete` | `remove-image-tag` in `pull-request-closed.yaml`        |

## Running

The examples below pull `latest`, the last release. Use the `edge` tag for the last build of `main`, or `local` for an image you built yourself.

Run the image with a read-only root filesystem, without capabilities, and without privilege escalation. The server needs none of them.

```bash
docker run --rm --publish 3000:3000 --read-only --cap-drop=ALL --security-opt=no-new-privileges dndmapp/api-content
```

The server listens on port `3000` by default, the same port as `pnpm run start`. Set the [environment variables](configuration.md#environment-variables) with `--env`, such as `--env PORT=8080`, and publish the port you chose. The image does not load a `.env` file, since `.dockerignore` keeps it out of the build context.

The server stops gracefully on `SIGTERM`, which `docker stop` sends, so open requests finish first.

## Docker Compose

A Compose service takes the same settings as the `docker run` command above. It needs no `healthcheck` key, since it inherits the `HEALTHCHECK` of the image.

```yaml
services:
    api-content:
        image: dndmapp/api-content
        ports:
            - "3000:3000"
        read_only: true
        cap_drop:
            - ALL
        security_opt:
            - no-new-privileges:true
```

Start it with `docker compose up --detach`, and check its health with `docker compose ps`, which shows `healthy` once the server is ready. Set the [environment variables](configuration.md#environment-variables) under `environment`, and change the port mapping to match `PORT`. Another service that needs the API can wait for it with `depends_on` and `condition: service_healthy`.

## Health check

The `HEALTHCHECK` of the image runs `.docker/healthcheck.js`, which requests `GET /health/ready` on `127.0.0.1` and the port in `PORT`. The script exits with `0` when the server answers with a success status, and with `1` otherwise. Docker marks the container unhealthy after three failures in a row.

The script reads `PORT` from `process.env` directly, an exception to the rule in [Configuration](configuration.md#namespaces), since the `server` namespace would load NestJS and Zod on every check. Like the namespace, it falls back to `3000` when `PORT` is unset or empty.

| Option             | Value | Meaning                                                    |
|:-------------------|------:|:-----------------------------------------------------------|
| `--interval`       | `30s` | The time between two checks once the container has started |
| `--timeout`        |  `3s` | The time a check may take before it counts as a failure    |
| `--start-period`   | `10s` | The time during which failures do not count                |
| `--start-interval` |  `1s` | The time between two checks during the start period        |
| `--retries`        |   `3` | The failures in a row that mark the container unhealthy    |

Keep `HOST` at an address that includes `127.0.0.1`, such as the default `0.0.0.0`, or the health check cannot reach the server.

## Kubernetes

Kubernetes ignores the `HEALTHCHECK` of an image, so configure its probes on the container. The startup and liveness probes request `/health/live`, so a failing dependency never restarts the container. The readiness probe requests `/health/ready`, so the container gets traffic only when it can serve it. [Architecture](architecture.md#health-probes) explains the difference.

```yaml
containers:
    - name: api-content
      image: dndmapp/api-content
      ports:
          - name: http
            containerPort: 3000
      securityContext:
          allowPrivilegeEscalation: false
          capabilities:
              drop: ["ALL"]
          readOnlyRootFilesystem: true
          runAsNonRoot: true
      startupProbe:
          httpGet:
              path: /health/live
              port: http
          periodSeconds: 1
          failureThreshold: 30
      livenessProbe:
          httpGet:
              path: /health/live
              port: http
          periodSeconds: 10
          failureThreshold: 3
      readinessProbe:
          httpGet:
              path: /health/ready
              port: http
          periodSeconds: 5
          failureThreshold: 3
```

The liveness and readiness probes start once the startup probe succeeds. `runAsNonRoot` works because the image sets its user by ID, `1000:1000`.

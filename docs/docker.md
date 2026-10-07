# Docker

The `Dockerfile` builds a production image of the server for `linux/amd64` and `linux/arm64`. CI builds it with Docker Bake and publishes it to Docker Hub as [`dndmapp/api-content`](https://hub.docker.com/r/dndmapp/api-content). The [image README](../.docker/README.md), which is also its overview on Docker Hub, explains how to run it.

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

It tags the image `dndmapp/api-content:local`, which runs as the [image README](../.docker/README.md#running) describes. Docker can only load a multi-platform image when it uses the containerd image store, which new installs of Docker Desktop turn on by default.

Build the image for the platform of your machine alone:

```bash
docker build --tag dndmapp/api-content:local .
```

The `Dockerfile` starts with `# check=error=true`, so a violation of the [build checks](https://docs.docker.com/build/checks/) fails the build. Run the checks alone with `pnpm run lint-docker`, which CI runs too.

## Publishing

The composite action in `.github/actions/docker` sets up Buildx, logs in to Docker Hub, and builds the `ci` target with Bake from the checkout of the job. Before the build, `docker/metadata-action` generates the tags of the event, the OCI labels, and the annotations of the image manifests and the index. The `Dockerfile` sets no labels of its own for this reason.

### Tags

Each event pushes its own tags: a pull request from `pull-request.yaml`, a push to `main` from `push-main.yaml`, and a release tag from `release.yaml`. The [image README](../.docker/README.md#tags) lists the tags of each event and explains `latest` and `edge`.

### Workflows

On a pull request, the `Docker` job runs in parallel with CI, so reviewers get the image sooner. Once the pull request closes, merged or not, the `remove-image-tag` job of `pull-request-closed.yaml` deletes `pr-<N>` through the Docker Hub API. It cancels a build of the pull request that is still running, so the tag cannot come back. Pull requests from forks get no secrets, so both jobs skip them.

On `main`, the `docker` job waits for CI, so `edge` only moves to a commit that passed. A release rebuilds the image at the tag after the CI checks, rather than retagging the build of `main`, so its labels and provenance name the version.

### Path filter

On pull requests and on `main`, a `changes` job runs the composite action in `.github/actions/changes` first. The action runs [`dorny/paths-filter`](https://github.com/dorny/paths-filter), and its `image` output tells the image job to run only when the change touches one of these paths. Changes to the docs alone build no image. Releases build without the filter.

- The files that `.dockerignore` lets in, without the specs under `src`, which never reach `dist`.
- The `Dockerfile`, `.dockerignore`, and `docker-bake.hcl`.
- The composite actions in `.github/actions/docker` and `.github/actions/changes`, and the workflow that runs the job, so a change to the pipeline tests itself.

A pull request compares with its base, so once it touches the image, every later push rebuilds `pr-<N>`. `main` compares each push with the previous one, which for a merge commit covers the whole pull request. When a merge leaves the image alone, `edge` keeps pointing at the last build, and that commit gets no `sha-<short-sha>` tag. Each workflow passes its own path to the action, so add a new path to the filter in the action alone.

### Docker Hub description

The overview and the short description of the repository on Docker Hub come from two files: `.docker/README.md` and `.docker/short-description.txt`. On `main`, the `docker-hub-description` job syncs both with [`peter-evans/dockerhub-description`](https://github.com/peter-evans/dockerhub-description) when the `description` output of the `changes` action says that either file changed. A change to the job or the action alone does not sync. The job drops the final newline of the short description before the sync. It logs in with `DOCKERHUB_TOKEN_DELETE`, because Docker Hub answers `403 Forbidden` when a token without the `delete` scope updates a description.

The job does not wait for CI. The `CI` job of the pull request runs the same checks and is a required status check, and the ruleset requires the branch to be up to date before it merges. The text on `main` has therefore already passed. When two syncs overlap, the newer one cancels the older one.

Docker Hub limits the short description to 100 bytes and the overview to 25,000 bytes, and the action truncates longer text with only a warning in the log. Write the links of the overview as absolute URLs, since the action resolves relative links from the root of the repository rather than from `.docker`. Edits made on Docker Hub itself last only until the next sync, so change the files instead.

### Credentials

The workflows log in with personal access tokens of the `dndmapp` Docker Hub account. Each token has only the scope its job needs. The variable and the secrets live at the level of the GitHub organization.

| Name                     | Kind     | Scope               | Used by                                                                                            |
|:-------------------------|:---------|:--------------------|:---------------------------------------------------------------------------------------------------|
| `DOCKERHUB_USERNAME`     | Variable |                     | Every login, and the namespace of the image                                                        |
| `DOCKERHUB_TOKEN_READ`   | Secret   | `read`              | Nothing yet                                                                                        |
| `DOCKERHUB_TOKEN_WRITE`  | Secret   | `read,write`        | The image jobs of the pull request, `main`, and release                                            |
| `DOCKERHUB_TOKEN_DELETE` | Secret   | `read,write,delete` | `remove-image-tag` in `pull-request-closed.yaml`, and `docker-hub-description` in `push-main.yaml` |

## Health check

The [image README](../.docker/README.md#health-check) describes the `HEALTHCHECK` of the image and its options. It runs `.docker/healthcheck.js`, which exits with `0` when `GET /health/ready` answers with a success status, and with `1` otherwise.

The script reads `PORT` from `process.env` directly, an exception to the rule in [Configuration](configuration.md#namespaces), since the `server` namespace would load NestJS and Zod on every check. Like the namespace, it falls back to `3000` when `PORT` is unset or empty.

# Docker

The `Dockerfile` builds a production image of the server for `linux/amd64` and `linux/arm64`. The image is not published yet; [#16](https://github.com/dnd-mapp/api-content/issues/16) tracks building and publishing it from CI.

## The image

The `Dockerfile` has four stages.

| Stage          | Platform  | Purpose                                                                         |
|:---------------|:----------|:--------------------------------------------------------------------------------|
| `pnpm`         | Builder   | The official image of the standalone pnpm binary, which the other stages copy   |
| `dependencies` | Builder   | Installs the production dependencies with `pnpm install --prod`                 |
| `build`        | Builder   | Installs every dependency and compiles the application into `dist`              |
| `runtime`      | Target    | Copies `package.json`, the production dependencies, and `dist` into a new image |

The install and build stages run on the platform of the builder, and the final stage only copies files. A multi-platform build therefore installs and compiles once, and needs no emulation. Every base image is pinned by tag and digest, and Renovate keeps the digests current. It moves the Node.js and pnpm images in the same pull request as `devEngines` in `package.json`.

The image runs `node --enable-source-maps dist/main.js` from `/app` as the unprivileged `node` user, with `NODE_ENV=production`. The files belong to root, so the server can read them but not change them. The source maps ship with the image, so a stack trace points to the TypeScript sources.

The `.dockerignore` file lets only the sources, the package manifest, the lockfile, and the compiler configs into the build context. Add a file there when the build needs it.

The production dependencies are installed for the builder and copied as they are. That works because none of them holds native code. A future dependency with native code must be installed for `$TARGETPLATFORM` instead, for example in a stage that runs on the target platform.

## Building

Build the image for the platform of your machine:

```bash
docker build --tag dnd-mapp/api-content .
```

Build it for both platforms with Buildx. Docker can only load a multi-platform image when it uses the containerd image store, which new installs of Docker Desktop turn on by default.

```bash
docker buildx build --platform linux/amd64,linux/arm64 --tag dnd-mapp/api-content .
```

The `Dockerfile` starts with `# check=error=true`, so a violation of the [build checks](https://docs.docker.com/build/checks/) fails the build.

## Running

Run the image with a read-only root filesystem, without capabilities, and without privilege escalation. The server needs none of them.

```bash
docker run --rm --publish 3000:3000 --read-only --cap-drop=ALL --security-opt=no-new-privileges dnd-mapp/api-content
```

The server listens on port `3000` by default, the same port as `pnpm run start`. Set the [environment variables](configuration.md#environment-variables) with `--env`, such as `--env PORT=8080`, and publish the port you chose. The image does not load a `.env` file, since `.dockerignore` keeps it out of the build context.

The server stops gracefully on `SIGTERM`, which `docker stop` sends, so open requests finish first.

## Health check

The `HEALTHCHECK` of the image requests `GET /health/ready` on `127.0.0.1` and the port in `PORT`. Docker marks the container unhealthy after three failures in a row.

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
      image: dnd-mapp/api-content
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

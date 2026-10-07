# D&D Mapp content API

The content API of [D&D Mapp](https://github.com/dnd-mapp), a [NestJS](https://nestjs.com/) application. It will serve the static content of the game: races, classes, backgrounds, items, spells, and the rules and mechanics. So far it serves the health endpoints under `/health` that an orchestrator probes.

The image runs on `linux/amd64` and `linux/arm64` as an unprivileged user. Its source, issues, and docs live in the [dnd-mapp/api-content](https://github.com/dnd-mapp/api-content) repository on GitHub.

## Tags

| Event                | Tags                                                 |
|:---------------------|:-----------------------------------------------------|
| Pull request         | `pr-<N>`                                             |
| Push to `main`       | `edge` and `sha-<short-sha>`                         |
| Release tag `vX.Y.Z` | `X.Y.Z`, `X.Y`, and `latest`, plus `X` from 1.0.0 on |

`latest` moves only on releases, and `edge` follows `main`. The bare major tag is left out for `0.y.z` versions, because any 0.x release may break the API. A `pr-<N>` tag is deleted once its pull request closes.

## Running

The examples below pull `latest`, the last release. Use the `edge` tag for the last build of `main`.

Run the image with a read-only root filesystem, without capabilities, and without privilege escalation. The server needs none of them.

```bash
docker run --rm --publish 3000:3000 --read-only --cap-drop=ALL --security-opt=no-new-privileges dndmapp/api-content
```

The server listens on port `3000` by default. Set the [environment variables](https://github.com/dnd-mapp/api-content/blob/main/docs/configuration.md#environment-variables) with `--env`, such as `--env PORT=8080`, and publish the port you chose. The image does not load a `.env` file.

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

Start it with `docker compose up --detach`, and check its health with `docker compose ps`, which shows `healthy` once the server is ready. Set the [environment variables](https://github.com/dnd-mapp/api-content/blob/main/docs/configuration.md#environment-variables) under `environment`, and change the port mapping to match `PORT`. Another service that needs the API can wait for it with `depends_on` and `condition: service_healthy`.

## Health check

The `HEALTHCHECK` of the image requests `GET /health/ready` on `127.0.0.1` and the port in `PORT`. A check passes when the server answers with a success status. Docker marks the container unhealthy after three failures in a row.

| Option             | Value | Meaning                                                    |
|:-------------------|------:|:-----------------------------------------------------------|
| `--interval`       | `30s` | The time between two checks once the container has started |
| `--timeout`        |  `3s` | The time a check may take before it counts as a failure    |
| `--start-period`   | `10s` | The time during which failures do not count                |
| `--start-interval` |  `1s` | The time between two checks during the start period        |
| `--retries`        |   `3` | The failures in a row that mark the container unhealthy    |

Keep `HOST` at an address that includes `127.0.0.1`, such as the default `0.0.0.0`, or the health check cannot reach the server.

## Kubernetes

Kubernetes ignores the `HEALTHCHECK` of an image, so configure its probes on the container. The startup and liveness probes request `/health/live`, so a failing dependency never restarts the container. The readiness probe requests `/health/ready`, so the container gets traffic only when it can serve it. [Architecture](https://github.com/dnd-mapp/api-content/blob/main/docs/architecture.md#health-probes) explains the difference.

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

## License

[MIT](https://github.com/dnd-mapp/api-content/blob/main/LICENSE) © D&D Mapp

# D&D Mapp content API

[![push main](https://github.com/dnd-mapp/api-content/actions/workflows/push-main.yaml/badge.svg?branch=main)](https://github.com/dnd-mapp/api-content/actions/workflows/push-main.yaml)
[![license](https://img.shields.io/github/license/dnd-mapp/api-content)](LICENSE)

The content API of D&D Mapp, a [NestJS](https://nestjs.com/) application. It serves the health endpoints that Kubernetes and Docker probe, and nothing else yet.

## Endpoints

Both endpoints answer `200` with the [Terminus](https://docs.nestjs.com/recipes/terminus) health check result while the check passes, and `503` with the failing details once it does not. They send `Cache-Control: no-cache, no-store, must-revalidate`, so a probe never reads a cached answer.

| Endpoint            | Probe     | Passes when                                                                                            |
|:--------------------|:----------|:-------------------------------------------------------------------------------------------------------|
| `GET /health/live`  | Liveness  | The process serves requests. It checks no dependency, so an outage of one never restarts the container |
| `GET /health/ready` | Readiness | The application can take traffic. It checks no dependencies yet                                        |

```json
{ "status": "ok", "info": {}, "error": {}, "details": {} }
```

## Running the server

Install Node.js and pnpm in the versions that `devEngines` in `package.json` sets, then install the dependencies.

```bash
pnpm install
```

Start the server in watch mode, which recompiles and restarts it as you edit, or build it into `dist` and run the build.

```bash
pnpm run start-dev
pnpm run build
pnpm run start-prod
```

The server listens on the port in the `PORT` environment variable, and on `3000` when it is unset. The server shuts down gracefully on `SIGTERM` and `SIGINT`, so an orchestrator can stop it without cutting off requests.

## Docker

The `Dockerfile` builds the server into an image that runs the compiled application as the unprivileged `node` user, with only the runtime dependencies. Its `HEALTHCHECK` requests `GET /health/live` every 30 seconds and marks the container unhealthy after three failures in a row.

```bash
docker build --tag dnd-mapp/api-content .
docker run --rm --publish 3000:3000 dnd-mapp/api-content
docker inspect --format '{{.State.Health.Status}}' <container>
```

## Kubernetes

Point the probes of the container at the two endpoints. The startup probe reuses the liveness endpoint and gives the server time to start before the liveness probe can restart it.

```yaml
containers:
    - name: api-content
      image: dnd-mapp/api-content
      ports:
          - containerPort: 3000
      startupProbe:
          httpGet:
              path: /health/live
              port: 3000
          failureThreshold: 30
          periodSeconds: 1
      livenessProbe:
          httpGet:
              path: /health/live
              port: 3000
          periodSeconds: 10
      readinessProbe:
          httpGet:
              path: /health/ready
              port: 3000
          periodSeconds: 5
```

## Contributing

Contributions are welcome. See the [contributing guide](CONTRIBUTING.md) for the project layout, the checks, the release steps, and the commit conventions.

## License

[MIT](LICENSE) © D&D Mapp

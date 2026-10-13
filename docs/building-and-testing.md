# Building and testing

## Building

The `build` script compiles the application with the Nest CLI into `dist`. [SWC](https://swc.rs/) transpiles the files, and `tsc` type checks them in parallel, so a type error fails the build without slowing the transpilation down. The `start` script compiles and runs it in watch mode, so it recompiles and restarts as you edit. [Docker](docker.md) explains how to build the image, and the [image README](../.docker/README.md) how to run it.

## Testing

Tests use Vitest. The specs in `src` test a class through a testing module from `@nestjs/testing` that imports the module of the class, so the module resolves the dependencies the same way it does in the application. The [end-to-end suite](#end-to-end-tests) covers the rest. Vitest reads `experimentalDecorators` and `emitDecoratorMetadata` from the TypeScript project, so the decorators of NestJS work without a plugin. Coverage must stay above the thresholds in `vitest.config.ts`.

A spec that reads files mocks `node:fs` rather than write files to disk. It calls `vi.mock('node:fs')`, which loads the mock in `testing/mocks/fs.ts` through `__mocks__/fs.ts`, and adds the files it needs with `givenFile` from `@/testing`. The mock clears the files after each test, and holds only the functions that the code under test calls, so a spec never touches the real file system. Add a function to the mock when the code starts to call it.

## End-to-end tests

The specs in `e2e` request a running server with `fetch`, so they cover what the unit specs cannot: the root module, the routes, and the headers that a client sees. Run them once, or in watch mode with the Vitest UI:

```bash
pnpm run e2e-ci
pnpm run e2e
```

The suite requests the server at `E2E_BASE_URL`, which defaults to the dev server at `https://localhost.content.dndmapp.dev:3000`. It needs the [Local HTTPS](local-https.md) setup, since Node.js trusts the CA of mkcert through the trust store of the system, with `--use-system-ca`. When `GET /health/live` answers, the suite uses that server and leaves it running, so a `pnpm run start` in watch mode keeps its state between runs. Otherwise it starts `pnpm run start` itself, waits up to 60 seconds for `GET /health/ready`, and stops the server and every process it started after the run. When the server is not ready in time, the run fails and prints the output of the server.

In watch mode, the suite starts the dev server once and stops it when Vitest exits, also when a signal such as the stop button of an IDE ends Vitest. A change under `src` reruns no spec, since the specs import no source. The dev server restarts on it, so rerun the specs from the UI once it is ready.

The suite has its own config in `e2e/vitest.config.ts`, and measures no coverage, since the server runs in another process. `pnpm test` and `test-ci` run the unit specs only.

In CI, the `E2E` job runs the suite against the Docker image behind [Caddy](https://caddyserver.com/), which terminates TLS like the ingress. `e2e/compose.yaml` runs the image in `API_CONTENT_IMAGE`, or `dndmapp/api-content:edge` when the variable is unset, without a published port, and Caddy in front of it on port `8443`. Caddy issues the certificate from a CA of its own, as `tls internal` in `e2e/Caddyfile` asks. The composite action in `.github/actions/e2e` starts the stack with `docker compose up --wait` and copies the root certificate of Caddy out of the container. It then runs the suite with `E2E_BASE_URL=https://localhost:8443`, and with `NODE_EXTRA_CA_CERTS` pointing at that certificate. When the suite fails, the job uploads the logs of the stack as the `e2e-stack-logs` artifact. [Docker](docker.md#workflows) describes which image the job tests, and why it fails on a pull request from a fork.

## Checks

Check and format the repository with these commands. CI runs `format-check`, actionlint, `lint-docker`, `lint-md`, a check of the size of the [Docker Hub description](docker.md#docker-hub-description), `lint-ts`, `typecheck`, `build`, and `test-ci`, in that order. The `E2E` job runs `e2e-ci` against the image. Run them yourself before you open a pull request, `e2e-ci` with the [Local HTTPS](local-https.md) setup.

```bash
pnpm run format-check
pnpm run format
actionlint
pnpm run lint-docker
pnpm run lint-md
pnpm run lint-ts
pnpm run typecheck
pnpm run build
pnpm run test-ci
pnpm run e2e-ci
```

The `lint-docker` script runs the [build checks](https://docs.docker.com/build/checks/) of Docker on the `Dockerfile`, which needs a running Docker daemon. The `lint-md` script lints the Markdown files with markdownlint, and the `lint-ts` script lints the code with ESLint. The `typecheck` script checks the three TypeScript projects with `tsc -b`. Use `pnpm test` to run the tests in watch mode with the Vitest UI.

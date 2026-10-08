# Architecture

## Project layout

The repository is a NestJS workspace with a single application. The Nest CLI reads `nest-cli.json` to find the sources, the entry file, and the TypeScript project it compiles with.

| File                              | Purpose                                                                                                  |
|:----------------------------------|:---------------------------------------------------------------------------------------------------------|
| `src/main.ts`                     | Creates the application over HTTPS or HTTP, enables the shutdown hooks, and listens on the host and port |
| `src/app.module.ts`               | The root module, which loads the configuration and imports the feature modules                           |
| `src/config/environment.ts`       | The Zod schema that validates every environment variable, merged from the namespaces                     |
| `src/config/server.config.ts`     | The `server` namespace, with the host and port that the server listens on                                |
| `src/config/tls.config.ts`        | The `tls` namespace, with the certificate and key that the server serves HTTPS with                      |
| `src/config/empty-as-unset.ts`    | The helper that treats an empty environment variable as unset                                            |
| `src/config/index.ts`             | The public entry of the configuration, behind the `@/config` alias                                       |
| `src/health/health.module.ts`     | The health module, which imports Terminus and registers the controller                                   |
| `src/health/index.ts`             | The public entry of the health module, behind the `@/health` alias                                       |
| `src/health/health.controller.ts` | The `/health/live` and `/health/ready` endpoints                                                         |
| `nest-cli.json`                   | The Nest CLI config, which `nest build` and `nest start` read                                            |
| `tools/setup-https.ts`            | The `setup-https` script, which creates the certificate of the dev server with mkcert                    |
| `testing/index.ts`                | The public entry of the test helpers, behind the `@/testing` alias                                       |
| `testing/mocks/fs.ts`             | The mock of `node:fs`, which reads in-memory files that a spec adds with `givenFile`                     |
| `__mocks__/fs.ts`                 | Forwards `vi.mock('node:fs')` to the mock in `testing`, since Vitest looks for it only in this folder    |
| `.env.example`                    | The environment variables, to copy into a `.env` or `.env.local` file                                    |
| `.swcrc`                          | The SWC options that the Nest CLI merges into its defaults                                               |
| `tsconfig.json`                   | The solution file, and the shared base that the three projects build on                                  |
| `tsconfig.app.json`               | The application project, which the type check of `nest build` reads                                      |
| `tsconfig.spec.json`              | The spec project, which adds the Vitest globals, the test helpers, and the mocks                         |
| `tsconfig.tools.json`             | The tools project, for the config files in the repository root and the scripts in `tools`                |
| `.docker/healthcheck.js`          | The `HEALTHCHECK` of the Docker image, which requests the readiness endpoint                             |

## Modules

Import local files without an extension. SWC appends `.js` in the build because `resolveFully` is on, and `tsc` and Vitest resolve the import through the `bundler` module resolution.

Every module under `src` has an `index.ts` that exports only what other modules need from it, and a path alias such as `@/health` that maps to that file. Import another module through its alias, never through a path into its directory, and keep the module itself free of imports from its own alias. The aliases live in the `paths` of `tsconfig.json`, which `tsc` and the Nest CLI read and Vitest picks up through `resolve.tsconfigPaths`. Add a new module there.

Generate a module, controller, or provider with the Nest CLI, which places it under `src`:

```bash
pnpm exec nest generate module <name>
pnpm exec nest generate controller <name>
```

The schematics write `.js` import extensions and a Jest-style spec. Drop the extensions, and rewrite the spec for Vitest.

## Side effects

Only `src/main.ts`, the `ConfigModule` in `src/app.module.ts`, and the namespace factories in `src/config` touch the process. `ConfigModule` loads the `.env` files and validates the environment variables, the factories read them, and `src/main.ts` listens and enables the shutdown hooks. Keep the feature modules, controllers, and providers free of that, so the specs can create them through `@nestjs/testing` without side effects.

## Health probes

The health endpoints have different jobs. The liveness probe tells the orchestrator whether to restart the container, so it checks nothing but the process itself. The readiness probe tells the orchestrator whether to route traffic to the container, so a check for every dependency the application needs to serve a request belongs there, as a [Terminus health indicator](https://docs.nestjs.com/recipes/terminus).

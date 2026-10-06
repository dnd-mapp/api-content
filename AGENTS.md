# Agent instructions

## Project

This repository holds the D&D Mapp content API, a NestJS application that so far serves only the health endpoints under `/health` for Kubernetes and Docker. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the layout, the scripts, and the commit and branch conventions.

- Keep the application free of features until an issue asks for one. The health endpoints are the whole surface for now.
- Put every readiness requirement in the readiness probe as a Terminus health indicator, and keep the liveness probe free of dependency checks, so a failing dependency never restarts the container.
- Import local files without an extension. SWC appends `.js` in the build, and `tsc` and Vitest resolve it as is.
- Import another module through its path alias, such as `@/health`, which maps to the `index.ts` of the module. Add the alias of a new module to the `paths` of `tsconfig.app.json` and the `resolve.alias` of `vitest.config.ts`, and export only what other modules need from the `index.ts`.
- Run `format-check`, `lint-md`, `lint-ts`, `typecheck`, `test-ci`, `build`, and `actionlint` before you commit.

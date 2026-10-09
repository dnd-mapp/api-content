# Agent instructions

## Project

This repository holds the D&D Mapp content API, a NestJS application that will serve the static content of the game: races, classes, backgrounds, items, spells, and the rules and mechanics. So far it serves the health endpoints under `/health`. Read the [shared contributing guide](https://github.com/dnd-mapp/.github/blob/main/CONTRIBUTING.md) for the conventions that every D&D Mapp repository follows, and [docs/contributing/README.md](docs/contributing/README.md) for the code style, the checks, and the changelog rules of this repository. The [docs](docs) folder covers the layout, the configuration, and the scripts.

- Put every readiness requirement in the readiness probe as a Terminus health indicator, and keep the liveness probe free of dependency checks, so a failing dependency never restarts the container.
- Import local files without an extension. SWC appends `.js` in the build, and `tsc` and Vitest resolve it as is.
- Import another module through its path alias, such as `@/health`, which maps to the `index.ts` of the module. Add the alias of a new module to the `paths` of `tsconfig.json`, which Vitest also reads, and export only what other modules need from the `index.ts`.
- Run `format-check`, `actionlint`, `lint-docker`, `lint-md`, `lint-ts`, `typecheck`, `build`, and `test-ci` before you commit.

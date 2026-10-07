# Agent instructions

## Project

This repository holds the D&D Mapp content API, a NestJS application that will serve the static content of the game: races, classes, backgrounds, items, spells, and the rules and mechanics. So far it serves the health endpoints under `/health`. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the layout, the scripts, and the commit and branch conventions.

- Put every readiness requirement in the readiness probe as a Terminus health indicator, and keep the liveness probe free of dependency checks, so a failing dependency never restarts the container.
- Import local files without an extension. SWC appends `.js` in the build, and `tsc` and Vitest resolve it as is.
- Import another module through its path alias, such as `@/health`, which maps to the `index.ts` of the module. Add the alias of a new module to the `paths` of `tsconfig.json`, which Vitest also reads, and export only what other modules need from the `index.ts`.
- Run `format-check`, `actionlint`, `lint-md`, `lint-ts`, `typecheck`, `build`, and `test-ci` before you commit.

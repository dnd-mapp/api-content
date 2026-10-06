# Agent instructions

## Project

This repository holds the D&D Mapp content API, a NestJS application that so far serves only the health endpoints under `/health` for Kubernetes and Docker. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the layout, the scripts, and the commit and branch conventions.

- Keep the application free of features until an issue asks for one. The health endpoints are the whole surface for now.
- Put every readiness requirement in the readiness probe as a Terminus health indicator, and keep the liveness probe free of dependency checks, so a failing dependency never restarts the container.
- Import local files with the `.ts` extension. The build rewrites it, and Vitest resolves it.
- Run `format-check`, `lint-md`, `lint-ts`, `typecheck`, `test-ci`, `build`, `docker build .`, and `actionlint` before you commit.

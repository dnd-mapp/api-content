# Contributing to dnd-mapp/api-content

This page adds the details of `dnd-mapp/api-content` to the [shared contributing guide](https://github.com/dnd-mapp/.github/blob/main/CONTRIBUTING.md). Read that guide first.

## Project layout

[Architecture](../architecture.md) describes the project layout, the modules, and the health probes. Read it before you change the code. The other pages in `docs` cover the rest:

- [Configuration](../configuration.md): the environment variables, the configuration namespaces, and how to add one.
- [Local HTTPS](../local-https.md): the one-time setup of mkcert and the host for the dev server.
- [Building and testing](../building-and-testing.md): the build, the tests, and the checks.
- [Docker](../docker.md): building and publishing the image.
- [Releasing](../releasing.md): the steps to publish a release.

## Checks

On top of the [shared checks](https://github.com/dnd-mapp/.github/blob/main/CONTRIBUTING.md#checks), CI runs `lint-docker`, a check of the size of the Docker Hub description, `lint-ts`, `typecheck`, `build`, and `test-ci`. Run them before you open a pull request:

```bash
pnpm run lint-docker
pnpm run lint-ts
pnpm run typecheck
pnpm run build
pnpm run test-ci
```

The `lint-docker` script needs a running Docker daemon, as the section on [repositories with Docker](https://github.com/dnd-mapp/.github/blob/main/CONTRIBUTING.md#repositories-with-docker) describes. [Building and testing](../building-and-testing.md#checks) explains each check.

## Code style

NestJS resolves the dependencies of a class from the types of its constructor parameters, so import a class that you inject as a value import, not as a type import. Declare a field for each dependency and assign it in the constructor, rather than using a parameter property, so the fields of a class are all declared in one place. Mark every member of a class `public`, `protected`, or `private`, except the constructor. Return a promise from an `async` method with `return await`, so the method itself appears in the stack trace of a rejection. ESLint enforces all three. Mark every other import that is only used as a type with `import type`, which `verbatimModuleSyntax` requires.

## Changelog and versioning

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Record every change that the people who call the API or run the published image would notice under `[Unreleased]` in `CHANGELOG.md`, using the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. The changelog becomes the release notes, so ask of each change whether those people would notice it without reading the repository.

These changes get an entry:

- An endpoint, a response, a status code, or a header that clients see.
- An environment variable that the published image reads.
- The contract of the image: its platforms, its user, its port, its health check, its tags, and how it starts and stops.
- A dependency update that changes any of the above, or that fixes a vulnerability in the image. Record a vulnerability fix under `Security`.

These changes do not:

- How the `Dockerfile`, the build, and the workflows produce the image.
- Configuration that only a local run reads, such as the `.env` files.
- Tooling, tests, docs, refactors, and routine dependency updates.

A removed or renamed endpoint, a changed response, and a changed environment variable are breaking changes. So is a change that breaks how the image is run, such as a new port or user, a dropped platform, or a removed tag. Say so in the changelog entry.

## Releases

A maintainer ships the recorded changes as described in [Releasing](../releasing.md).

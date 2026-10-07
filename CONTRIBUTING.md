# Contributing

Thank you for your interest in contributing to the D&D Mapp content API.

## Before you start

Open an [issue](https://github.com/dnd-mapp/api-content/issues) to discuss any change beyond a typo fix before you send a pull request. This avoids work on changes that do not fit the goals of the project.

## Development setup

The required Node and pnpm versions are set in `devEngines` in `package.json`. They are enforced through `engineStrict`, so installing with other versions fails.

Install the dependencies with:

```bash
pnpm install
```

Dependency versions live in the catalogs in `pnpm-workspace.yaml`, which uses `catalogMode: strict`. Add or bump versions there and reference them in `package.json`. Use `catalog:` for the default catalog and a named catalog such as `catalog:nestjs` for a group of packages.

Newly published releases are held back for three days through `minimumReleaseAge`. You may need to wait before you can bump to a very recent version.

Install [actionlint](https://github.com/rhysd/actionlint) to lint the workflows locally, for example with `brew install actionlint`. CI runs the version that `.github/actions/ci/action.yaml` pins.

## Git hooks

[Lefthook](https://lefthook.dev/) installs the Git hooks when you run `pnpm install`. The hooks are defined in `lefthook.yaml`. `pnpm-workspace.yaml` turns off the side-effects cache of pnpm, because a cached build of lefthook skips the script that installs the hooks. If the hooks are still missing, install them with `pnpm exec lefthook install`.

| Hook         | Runs                                           | On                        |
|:-------------|:-----------------------------------------------|:--------------------------|
| `pre-commit` | Prettier, markdownlint-cli2, and ESLint checks | The staged files          |
| `commit-msg` | commitlint                                     | The message of the commit |

The pre-commit hooks only check files. Run `pnpm run format` to fix formatting issues, and `pnpm exec eslint --fix` to apply the fixes that ESLint can make. Stage the result.

## Changelog and versioning

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Record every notable change for the people who run or call the server under `[Unreleased]` in `CHANGELOG.md`, using the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

A removed or renamed endpoint, a changed response, and a changed environment variable are breaking changes. Say so in the changelog entry.

## Releasing

1. Run the [prepare release workflow](.github/workflows/prepare-release.yaml) on `main` with the part of the version to bump, for example `gh workflow run prepare-release.yaml -f bump=minor`. It opens the `chore: release X.Y.Z` pull request with auto-merge on.
2. Review and approve the pull request. Once it merges, the `tag` job of the [push workflow](.github/workflows/push-main.yaml) creates the annotated tag `vX.Y.Z` on the merge commit.
3. The [release workflow](.github/workflows/release.yaml) runs the CI checks, verifies the tag and the changelog, and creates the GitHub Release.

## Code style

Follow the rules in `.editorconfig`.

- Use UTF-8 and LF line endings.
- Indent with 4 spaces, or 2 spaces in `package.json` and `pnpm-*.yaml`.
- End every file with a newline and trim trailing whitespace.

NestJS resolves the dependencies of a class from the types of its constructor parameters, so import a class that you inject as a value import, not as a type import. Declare a field for each dependency and assign it in the constructor, rather than using a parameter property, so the fields of a class are all declared in one place. Mark every member of a class `public`, `protected`, or `private`, except the constructor. Return a promise from an `async` method with `return await`, so the method itself appears in the stack trace of a rejection. ESLint enforces all three. Mark every other import that is only used as a type with `import type`, which `verbatimModuleSyntax` requires.

Follow these rules for prose, including Markdown files.

- Never hard wrap prose. Write each paragraph or list item on a single line.
- Use US spelling, for example "color" and "behavior".
- Keep every sentence at or under 40 words.
- Pretty print Markdown tables so the columns line up, with alignment markers on every separator line.

## Branches

Create a branch from `main` for each change. Name it `<type>/<short-description>` in lowercase with hyphens between words, for example `feat/database-health-indicator` or `fix/port-parsing`.

Use the same types as for commits.

## Commits

Write commit messages that follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

```text
<type>(<optional scope>): <description>
```

Use one of these types.

| Type       | Use for                                                   |
|:-----------|:----------------------------------------------------------|
| `feat`     | A new endpoint, option, or health indicator               |
| `fix`      | A correction to existing behavior                         |
| `docs`     | Changes to documentation only                             |
| `refactor` | Changes that do not alter the behavior of the server      |
| `test`     | Changes to tests only                                     |
| `build`    | Changes to the build, the image, dependencies, or tooling |
| `ci`       | Changes to the workflows                                  |
| `chore`    | Other maintenance that does not fit above                 |

Write the description in the imperative mood, such as "add the readiness probe". Mark a breaking change with `!` after the type or scope, and add a `BREAKING CHANGE:` footer that explains what operators must do.

## Pull requests

- Keep each pull request to one change.
- Link the issue it addresses.
- Run the [checks](docs/building-and-testing.md#checks) before you open it.
- Update the changelog and README in the same pull request.
- Use a title that follows the commit convention.
- If you have write access, turn on auto-merge once the pull request is open, with `gh pr merge <number> --auto --merge` or the "Enable auto-merge" button. It then merges as soon as it is approved and the checks pass.
- If auto-merge is off, the author merges the pull request once it is approved and the checks pass. A maintainer merges pull requests opened by a contributor without write access.
- Renovate merges its own minor and patch pull requests once the checks pass. A maintainer approves a major update from Renovate and turns on auto-merge for it.
- Update the branch when it falls behind `main`, because auto-merge waits until the branch is up to date. The update dismisses the approval, so the pull request needs a new review.

## License

By contributing, you agree that your contributions are licensed under the [MIT license](LICENSE).

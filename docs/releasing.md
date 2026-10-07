# Releasing

A release ships the changes recorded under `[Unreleased]` in `CHANGELOG.md`, as the [contributing guide](../CONTRIBUTING.md#changelog-and-versioning) describes.

1. Run the [prepare release workflow](../.github/workflows/prepare-release.yaml) on `main` with the part of the version to bump, for example `gh workflow run prepare-release.yaml -f bump=minor`. It opens the `chore: release X.Y.Z` pull request with auto-merge on.
2. Review and approve the pull request. Once it merges, the `tag` job of the [push workflow](../.github/workflows/push-main.yaml) creates the annotated tag `vX.Y.Z` on the merge commit.
3. The [release workflow](../.github/workflows/release.yaml) runs the CI checks, verifies the tag and the changelog, and creates the GitHub Release.

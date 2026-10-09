# Releasing

A release ships the changes recorded under `[Unreleased]` in `CHANGELOG.md`, as the [contributing guide](contributing/README.md#changelog-and-versioning) describes.

1. Run the [prepare release workflow](../.github/workflows/prepare-release.yaml) on `main` with the part of the version to bump, for example `gh workflow run prepare-release.yaml -f bump=minor`. It opens the `chore: release X.Y.Z` pull request with auto-merge on.
2. Review and approve the pull request. Once it merges, the `tag` job of the [push workflow](../.github/workflows/push-main.yaml) creates the annotated tag `vX.Y.Z` on the merge commit.
3. The [release workflow](../.github/workflows/release.yaml) runs the CI checks and verifies the tag and the changelog. It then creates the GitHub Release, which opens a discussion in the Announcements category, and pushes the image to Docker Hub with the [release tags](../.docker/README.md#tags).

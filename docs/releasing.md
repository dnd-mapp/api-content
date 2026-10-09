# Releasing

A release ships the changes recorded under `[Unreleased]` in `CHANGELOG.md`, as the [contributing guide](contributing/README.md#changelog-and-versioning) describes.

1. Run the [prepare release workflow](../.github/workflows/prepare-release.yaml) on `main` with the part of the version to bump, for example `gh workflow run prepare-release.yaml -f bump=minor`. It opens the `chore: release X.Y.Z` pull request with auto-merge on.
2. Review and approve the pull request. Once it merges, the `tag` job of the [push workflow](../.github/workflows/push-main.yaml) creates the annotated tag `vX.Y.Z` on the merge commit.
3. The [release workflow](../.github/workflows/release.yaml) runs the CI checks and verifies the tag and the changelog. It then pushes the image to Docker Hub with the [release tags](../.docker/README.md#tags). Once the image is pushed, it creates the GitHub Release, which opens a discussion in the Announcements category.
4. When the image job fails, no GitHub Release is created. Rerun the failed jobs of the workflow run, which push the image and then create the release.

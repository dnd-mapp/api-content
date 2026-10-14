# Releasing

A release ships the changes recorded under `[Unreleased]` in `CHANGELOG.md`, as the [contributing guide](contributing/README.md#changelog-and-versioning) describes.

1. Add the `Security` entries for the [vulnerability fixes that reached the image](contributing/README.md#changelog-and-versioning) since the last tag, since Renovate merges them without one:
    - List the Dependabot alerts with `runtime` scope that closed as fixed. An alert counts when its `fixed_at` is later than the commit date of the last `vX.Y.Z` tag, which `git log -1 --format=%cI vX.Y.Z` prints. Before the first release, every fixed alert counts. Alerts that are still open get no entry.

        ```bash
        gh api --paginate 'repos/dnd-mapp/api-content/dependabot/alerts?state=fixed&scope=runtime' --jq '.[] | [.fixed_at, .dependency.package.name, (.security_advisory.cve_id // .security_advisory.ghsa_id), .security_advisory.severity] | @tsv'
        ```

    - Compare the Node.js version in `devEngines.runtime` of `package.json` at the last tag with the one on `main`. Read the [Node.js release notes](https://nodejs.org/en/blog/release) of each version in between: a security release counts as a fix that reached the image.
    - Write one entry per package or Node.js update, with the version the image now ships and each advisory it fixes. Name an advisory by its CVE ID, or by its GHSA ID when it has no CVE, with its severity. For example: "`<package>` X.Y.Z, which fixes CVE-YYYY-NNNNN (high) and CVE-YYYY-NNNNN (medium)."
    - Add the entries under `Security` in `[Unreleased]` through a pull request of their own, and wait for it to merge before the next step, so the release pull request only moves `[Unreleased]` and bumps the version.
2. Run the [prepare release workflow](../.github/workflows/prepare-release.yaml) on `main` with the part of the version to bump, for example `gh workflow run prepare-release.yaml -f bump=minor`. It opens the `chore: release X.Y.Z` pull request with auto-merge on.
3. Review and approve the pull request. Once it merges, the `tag` job of the [push workflow](../.github/workflows/push-main.yaml) creates the annotated tag `vX.Y.Z` on the merge commit.
4. The [release workflow](../.github/workflows/release.yaml) runs the CI checks and verifies the tag and the changelog. It then pushes the image to Docker Hub with the [release tags](../.docker/README.md#tags). Once the image is pushed, it creates the GitHub Release, which opens a discussion in the Announcements category.
5. When the image job fails, no GitHub Release is created. Rerun the failed jobs of the workflow run, which push the image and then create the release.

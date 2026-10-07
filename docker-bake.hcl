# Builds the image of the Dockerfile for both platforms. Run `docker buildx bake` for a local build, the same build that
# CI runs through .github/actions/docker.

# GitHub Actions sets GITHUB_ACTIONS to true, and Bake reads a variable from the environment variable of the same name.
variable "GITHUB_ACTIONS" {
    type    = bool
    default = false
}

# docker/metadata-action replaces this target in CI with the tags, the OCI labels, and the annotations of the event. The
# tag here only names a local build.
target "docker-metadata-action" {
    tags = ["dndmapp/api-content:local"]
}

target "default" {
    inherits  = ["docker-metadata-action"]
    platforms = ["linux/amd64", "linux/arm64"]
    attest    = ["type=provenance,mode=max", "type=sbom"]

    # The GitHub Actions cache needs the runtime token of a workflow run, so a local build skips it.
    cache-from = GITHUB_ACTIONS ? ["type=gha"] : []
    cache-to   = GITHUB_ACTIONS ? ["type=gha,mode=max"] : []
}

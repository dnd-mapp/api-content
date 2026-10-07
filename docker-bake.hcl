# Builds the image of the Dockerfile for both platforms. Run `docker buildx bake` for a local build of the default
# target. CI builds the ci target through .github/actions/docker.

# docker/metadata-action replaces this target in CI with the tags, the OCI labels, and the annotations of the event. The
# tag here only names a local build.
target "docker-metadata-action" {
    tags = ["dndmapp/api-content:local"]
}

target "default" {
    inherits  = ["docker-metadata-action"]
    platforms = ["linux/amd64", "linux/arm64"]
    attest    = ["type=provenance,mode=max", "type=sbom"]
}

# Adds the GitHub Actions cache, which needs the runtime token of a workflow run, so only CI builds this target.
target "ci" {
    inherits   = ["default"]
    cache-from = ["type=gha"]
    cache-to   = ["type=gha,mode=max"]
}

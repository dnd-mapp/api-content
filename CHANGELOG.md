# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The `GET /health/live` endpoint, the liveness probe. It answers `200` with the Terminus health check result as long as the process serves requests. The response carries `Cache-Control: no-cache, no-store, must-revalidate`.
- The `GET /health/ready` endpoint, the readiness probe. It answers `200` with the Terminus health check result once the application can take traffic. It checks no dependencies yet. The response carries `Cache-Control: no-cache, no-store, must-revalidate`.
- The `PORT` environment variable, which sets the port the server listens on. It defaults to `3000`, and the server refuses to start when it is not an unprivileged port, a whole number from 1024 to 65535.
- The `HOST` environment variable, which sets the hostname or IP address the server listens on. It defaults to `0.0.0.0`, and the server refuses to start when it is not a valid hostname or IP address.
- The `NODE_ENV` environment variable, which the image sets to `production`. The server refuses to start when it holds anything but `production`, `development`, or `test`. With `production`, the server serves HTTP only, and refuses to start when `TLS_CERT_FILE` or `TLS_KEY_FILE` is set. With `development`, it serves HTTPS and needs both files.
- The image on Docker Hub as [`dndmapp/api-content`](https://hub.docker.com/r/dndmapp/api-content), for `linux/amd64` and `linux/arm64` with an SBOM and a provenance attestation. It runs the server as the unprivileged `node` user on port `3000`, works on a read-only root filesystem, and probes `GET /health/ready` as its `HEALTHCHECK`. The server stops gracefully on `SIGTERM`, so open requests finish first. Each release is tagged `X.Y.Z`, `X.Y`, and `latest`, and `edge` follows the `main` branch.

[Unreleased]: https://github.com/dnd-mapp/api-content/commits/main

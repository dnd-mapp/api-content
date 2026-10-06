# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The `GET /health/live` endpoint, the liveness probe. It answers `200` with the Terminus health check result as long as the process serves requests.
- The `GET /health/ready` endpoint, the readiness probe. It answers `200` with the Terminus health check result once the application can take traffic. It checks no dependencies yet.
- The `PORT` environment variable, which sets the port the server listens on. It defaults to `3000`.
- The `Dockerfile`, which builds the server into an image that runs as the `node` user and probes `GET /health/live` as its `HEALTHCHECK`.

[Unreleased]: https://github.com/dnd-mapp/api-content/commits/main

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The `GET /health/live` endpoint, the liveness probe. It answers `200` with the Terminus health check result as long as the process serves requests.
- The `GET /health/ready` endpoint, the readiness probe. It answers `200` with the Terminus health check result once the application can take traffic. It checks no dependencies yet.
- The `PORT` environment variable, which sets the port the server listens on. It defaults to `3000`, and the server refuses to start when it is not an unprivileged port, a whole number from 1024 to 65535.
- The `HOST` environment variable, which sets the hostname or IP address the server listens on. It defaults to `0.0.0.0`, and the server refuses to start when it is not a valid hostname or IP address.
- The server loads environment variables from a `.env.local` and a `.env` file in the working directory. A variable set in the process wins over both files.

[Unreleased]: https://github.com/dnd-mapp/api-content/commits/main

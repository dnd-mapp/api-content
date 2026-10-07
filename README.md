# D&D Mapp content API

[![push main](https://github.com/dnd-mapp/api-content/actions/workflows/push-main.yaml/badge.svg?branch=main)](https://github.com/dnd-mapp/api-content/actions/workflows/push-main.yaml)
[![license](https://img.shields.io/github/license/dnd-mapp/api-content)](LICENSE)

The content API of D&D Mapp, a [NestJS](https://nestjs.com/) application. It will serve the static content of the game: races, classes, backgrounds, items, spells, and the rules and mechanics. So far it serves the health endpoints under `/health` that an orchestrator probes.

## Running the server

Install Node.js and pnpm in the versions that `devEngines` in `package.json` sets, then install the dependencies.

```bash
pnpm install
```

Start the server in watch mode, which recompiles and restarts it as you edit.

```bash
pnpm run start
```

The server shuts down gracefully on `SIGTERM` and `SIGINT`, so an orchestrator can stop it without cutting off requests.

## Configuration

The server reads its configuration from environment variables, which it also loads from a `.env.local` and a `.env` file. [Configuration](docs/configuration.md) lists every variable with its default.

## Documentation

- [Architecture](docs/architecture.md): the project layout, the modules, and the health probes.
- [Configuration](docs/configuration.md): the environment variables and the configuration namespaces.
- [Building and testing](docs/building-and-testing.md): the build, the tests, and the checks that CI runs.
- [Docker](docs/docker.md): building and running the image, and the probes for Kubernetes.
- [Releasing](docs/releasing.md): the steps to publish a release.

## Contributing

Contributions are welcome. See the [contributing guide](CONTRIBUTING.md) for the setup, the code style, and the branch, commit, and pull request conventions.

## License

[MIT](LICENSE) © D&D Mapp

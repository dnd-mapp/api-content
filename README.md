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

The server reads its configuration from environment variables. It also loads them from a `.env.local` and a `.env` file in the working directory, when those exist. A variable set in the process wins over both files, and `.env.local` wins over `.env`. Copy `.env.example` to start a file of your own; Git ignores both files.

| Variable |   Default | Purpose                                                                                 |
|:---------|----------:|:----------------------------------------------------------------------------------------|
| `HOST`   | `0.0.0.0` | The hostname or IP address the server listens on, where `0.0.0.0` is every IPv4 address |
| `PORT`   |    `3000` | The port the server listens on, an unprivileged port from 1024 to 65535                 |

The server validates the variables on startup, and refuses to start when one holds an invalid value.

## Contributing

Contributions are welcome. See the [contributing guide](CONTRIBUTING.md) for the project layout, the checks, the release steps, and the commit conventions.

## License

[MIT](LICENSE) © D&D Mapp

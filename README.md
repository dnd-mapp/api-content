# D&D Mapp content API

[![push main](https://github.com/dnd-mapp/api-content/actions/workflows/push-main.yaml/badge.svg?branch=main)](https://github.com/dnd-mapp/api-content/actions/workflows/push-main.yaml)
[![license](https://img.shields.io/github/license/dnd-mapp/api-content)](LICENSE)

The content API of D&D Mapp, a [NestJS](https://nestjs.com/) application. It will serve the static content of the game: races, classes, backgrounds, items, spells, and the rules and mechanics. So far it serves the health endpoints under `/health` that an orchestrator probes.

## Running the server

Install Node.js and pnpm in the versions that `devEngines` in `package.json` sets, then install the dependencies.

```bash
pnpm install
```

Start the server in watch mode, which recompiles and restarts it as you edit, or build it into `dist` and run the build.

```bash
pnpm run start-dev
pnpm run build
pnpm run start-prod
```

The server listens on the port in the `PORT` environment variable, and on `3000` when it is unset. The server shuts down gracefully on `SIGTERM` and `SIGINT`, so an orchestrator can stop it without cutting off requests.

## Contributing

Contributions are welcome. See the [contributing guide](CONTRIBUTING.md) for the project layout, the checks, the release steps, and the commit conventions.

## License

[MIT](LICENSE) © D&D Mapp

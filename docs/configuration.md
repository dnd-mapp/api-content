# Configuration

## Environment variables

The server reads its configuration from environment variables. It also loads them from a `.env.local` and a `.env` file in the working directory, when those exist. A variable set in the process wins over both files, and `.env.local` wins over `.env`. Copy `.env.example` to start a file of your own; Git ignores both files.

| Variable |   Default | Purpose                                                                                 |
|:---------|----------:|:----------------------------------------------------------------------------------------|
| `HOST`   | `0.0.0.0` | The hostname or IP address the server listens on, where `0.0.0.0` is every IPv4 address |
| `PORT`   |    `3000` | The port the server listens on, an unprivileged port from 1024 to 65535                 |

The server validates the variables on startup, and refuses to start when one holds an invalid value.

## Namespaces

Configuration is grouped into namespaces. Each one is made with `registerAs` of `@nestjs/config` in a `<name>.config.ts` file in `src/config`, and exported from `@/config`. A namespace has a [Zod](https://zod.dev/) schema keyed by the names of its environment variables. Its factory parses `process.env` with that schema and returns the values under camelCase names, such as `{ host, port }` for the `server` namespace.

Read configuration through a namespace only, never through `process.env` or by the name of a variable through `ConfigService.get`. A provider injects a namespace with `@Inject(serverConfig.KEY)` and types it as `ConfigType<typeof serverConfig>`, and `src/main.ts` gets it with `app.get(serverConfig.KEY)`.

`ConfigModule` validates the environment at startup against `environmentSchema` in `src/config/environment.ts`, which merges the schemas of all namespaces, so it reports every invalid variable at once. A factory parses its variables again, because it only sees `process.env`, which holds strings.

Prefix the variables of a namespace with its name in upper case, such as `DATABASE_URL` for a `database` namespace, unless an outside convention fixes the name. The `server` namespace is such an exception: `HOST` and `PORT` keep their plain names, since hosting platforms set `PORT`.

## Adding a namespace or variable

To add a namespace, create `src/config/<name>.config.ts` with its schema and factory, merge the shape of the schema into `environmentSchema`, and export the namespace from `src/config/index.ts`. Register a namespace that the whole application needs through `load` in `ConfigModule.forRoot`, as `server` is. A feature module loads its own namespace with `ConfigModule.forFeature`, such as `ConfigModule.forFeature(databaseConfig)`.

To add an environment variable, add it to the schema of its namespace with its type, default, and constraints, return it from the factory, and document it in `.env.example` and the [table of variables](#environment-variables). Record it in the changelog too when the published image reads it, as the [contributing guide](../CONTRIBUTING.md#changelog-and-versioning) describes. Give each constraint an error that names what the value must be and the value it got, since `ConfigModule` puts the name of the variable in front of it. Zod's `default()` only covers a variable that is unset, so wrap the schema of an optional variable in `z.preprocess(emptyAsUnset, ...)` to treat an empty one the same way.

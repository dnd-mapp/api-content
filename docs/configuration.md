# Configuration

## Environment variables

The server reads its configuration from environment variables. It also loads them from a `.env.local` and a `.env` file in the working directory, when those exist. A variable set in the process wins over both files, and `.env.local` wins over `.env`. Copy `.env.example` to start a file of your own; Git ignores both files.

| Variable        |           Default | Purpose                                                                                                     |
|:----------------|------------------:|:------------------------------------------------------------------------------------------------------------|
| `HOST`          |         `0.0.0.0` | The hostname or IP address the server listens on, where `0.0.0.0` is every IPv4 address                     |
| `PORT`          |            `3000` | The port the server listens on, an unprivileged port from 1024 to 65535                                     |
| `NODE_ENV`      |                   | The environment the server runs in: `development`, `production`, or `test`, where unset means `development` |
| `TLS_CERT_FILE` | `.certs/cert.pem` | The certificate that the server serves HTTPS with in development                                            |
| `TLS_KEY_FILE`  |  `.certs/key.pem` | The private key of the certificate                                                                          |

The server validates the variables on startup, and refuses to start when one holds an invalid value.

`NODE_ENV` decides how the server treats `TLS_CERT_FILE` and `TLS_KEY_FILE`. [Local HTTPS](local-https.md) explains how to create the certificate and the key.

| `NODE_ENV`                | `TLS_CERT_FILE` and `TLS_KEY_FILE`                                                                  |
|:--------------------------|:----------------------------------------------------------------------------------------------------|
| Unset or `development`    | Must point to readable files, which the server serves HTTPS with. It never falls back to HTTP.      |
| `production`              | Must be unset. The image sets `NODE_ENV=production` and serves HTTP, since the ingress handles TLS. |
| `test`                    | Optional and ignored, so the specs can load the application without a certificate.                  |
| Any other, such as `prod` | Fails the start, rather than count as development.                                                  |

## Namespaces

Configuration is grouped into namespaces. Each one is made with `registerAs` of `@nestjs/config` in a `<name>.config.ts` file in `src/config`, and exported from `@/config`. A namespace has a [Zod](https://zod.dev/) schema keyed by the names of its environment variables. Its factory parses `process.env` with that schema and returns the values under camelCase names, such as `{ host, port }` for the `server` namespace.

Read configuration through a namespace only, never through `process.env` or by the name of a variable through `ConfigService.get`. A provider injects a namespace with `@Inject(serverConfig.KEY)` and types it as `ConfigType<typeof serverConfig>`, and `src/main.ts` gets it with `app.get(serverConfig.KEY)`. The `tls` namespace is the exception: `src/main.ts` calls its factory, `tlsConfig()`, since Fastify takes the certificate when the adapter is created, before the application exists.

`ConfigModule` validates the environment at startup against `environmentSchema` in `src/config/environment.ts`, which merges the schemas of all namespaces, so it reports every invalid variable at once. A factory parses its variables again, because it only sees `process.env`, which holds strings.

Prefix the variables of a namespace with its name in upper case, such as `DATABASE_URL` for a `database` namespace, unless an outside convention fixes the name. The `server` namespace is such an exception: `HOST` and `PORT` keep their plain names, since hosting platforms set `PORT`. So is `NODE_ENV` in the `tls` namespace, a convention of Node.js. It moves to a namespace of its own once a second namespace reads it.

A rule across variables, such as the one between `NODE_ENV` and the TLS variables, goes in a check that the namespace exports, such as `checkTls`. Spreading the shape of a schema drops its refinements, so `environmentSchema` applies the check after it merges the shapes, and the factory of the namespace applies it as well.

## Adding a namespace or variable

To add a namespace, create `src/config/<name>.config.ts` with its schema and factory, merge the shape of the schema into `environmentSchema`, and export the namespace from `src/config/index.ts`. Register a namespace that the whole application needs through `load` in `ConfigModule.forRoot`, as `server` is. A feature module loads its own namespace with `ConfigModule.forFeature`, such as `ConfigModule.forFeature(databaseConfig)`.

To add an environment variable, add it to the schema of its namespace with its type, default, and constraints, return it from the factory, and document it in `.env.example` and the [table of variables](#environment-variables). Record it in the changelog too when the published image reads it, as the [contributing guide](contributing/README.md#changelog-and-versioning) describes. Give each constraint an error that names what the value must be and the value it got, since `ConfigModule` puts the name of the variable in front of it. Zod's `default()` only covers a variable that is unset, so wrap the schema of an optional variable in `z.preprocess(emptyAsUnset, ...)` to treat an empty one the same way.

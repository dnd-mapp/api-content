import { serverConfig, tlsConfig } from '@/config';
import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { readFileSync } from 'node:fs';
import { AppModule, configModule } from './app.module';

/** Returns the adapter, which serves HTTPS when the `tls` namespace holds a certificate and a key, and HTTP otherwise. */
function createAdapter() {
    const { certFile, keyFile } = tlsConfig();

    if (certFile === undefined || keyFile === undefined) {
        return new FastifyAdapter();
    }
    return new FastifyAdapter({ https: { cert: readFileSync(certFile), key: readFileSync(keyFile) } });
}

async function bootstrap() {
    // The factory of the `tls` namespace reads the variables that `ConfigModule` loads from the `.env` files. This
    // awaits the module rather than `ConfigModule.envVariablesLoaded`, which never settles when validation fails, so a
    // failed validation rejects with its error.
    await configModule;

    const app = await NestFactory.create<NestFastifyApplication>(AppModule, createAdapter());
    const { host, port } = app.get<ConfigType<typeof serverConfig>>(serverConfig.KEY);

    // Closes the application on SIGTERM, so a container orchestrator can stop it gracefully.
    app.enableShutdownHooks();

    await app.listen(port, host);
}

await bootstrap();

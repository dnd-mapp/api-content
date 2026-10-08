import { serverConfig, tlsConfig } from '@/config';
import { Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule, configModule } from './app.module';
import { listeningUrl } from './listening-url';

/**
 * Returns the adapter and whether it serves HTTPS, which it does when the `tls` namespace holds a certificate and a key.
 * It serves HTTP otherwise.
 */
function createAdapter() {
    const { cert, key } = tlsConfig();

    if (cert === undefined || key === undefined) {
        return { adapter: new FastifyAdapter(), https: false };
    }
    return { adapter: new FastifyAdapter({ https: { cert, key } }), https: true };
}

async function bootstrap() {
    // The factory of the `tls` namespace reads the variables that `ConfigModule` loads from the `.env` files. This
    // awaits the module rather than `ConfigModule.envVariablesLoaded`, which never settles when validation fails, so a
    // failed validation rejects with its error.
    await configModule;

    const { adapter, https } = createAdapter();
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter);
    const { host, port } = app.get<ConfigType<typeof serverConfig>>(serverConfig.KEY);

    // Closes the application on SIGTERM, so a container orchestrator can stop it gracefully.
    app.enableShutdownHooks();

    await app.listen(port, host);

    new Logger('Bootstrap').log(`Listening on ${listeningUrl({ host, port, https })}`);
}

await bootstrap();

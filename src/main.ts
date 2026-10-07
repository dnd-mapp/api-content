import { serverConfig } from '@/config';
import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
    const { host, port } = app.get<ConfigType<typeof serverConfig>>(serverConfig.KEY);

    // Closes the application on SIGTERM, so a container orchestrator can stop it gracefully.
    app.enableShutdownHooks();

    await app.listen(port, host);
}

await bootstrap();

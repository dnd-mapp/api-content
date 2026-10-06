import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.ts';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Closes the application on SIGTERM, so a container orchestrator can stop it gracefully.
    app.enableShutdownHooks();

    await app.listen(process.env['PORT'] ?? 3000);
}

await bootstrap();

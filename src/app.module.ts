import { environmentSchema, serverConfig } from '@/config';
import { HealthModule } from '@/health';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            cache: true,
            // The first file that sets a variable wins, and a variable set in the process wins over both files.
            envFilePath: ['.env.local', '.env'],
            isGlobal: true,
            load: [serverConfig],
            validationSchema: environmentSchema,
        }),
        HealthModule,
    ],
})
export class AppModule {}

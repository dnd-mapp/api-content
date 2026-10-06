import { HealthModule } from '@/health';
import { Module } from '@nestjs/common';

@Module({
    imports: [HealthModule],
})
export class AppModule {}

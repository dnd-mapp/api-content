import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';

/** The health endpoints that a container orchestrator probes, under `/health`. */
@Controller('health')
export class HealthController {
    private readonly healthCheckService: HealthCheckService;

    constructor(healthCheckService: HealthCheckService) {
        this.healthCheckService = healthCheckService;
    }

    /**
     * The liveness probe. It passes as long as the process answers requests, so the orchestrator restarts the
     * container once it stops answering.
     */
    @Get('live')
    @HealthCheck()
    live(): Promise<HealthCheckResult> {
        return this.healthCheckService.check([]);
    }

    /**
     * The readiness probe. It passes once the application can take traffic, so the orchestrator only routes requests
     * to it then. Add a health indicator here for every dependency that the application needs to serve a request.
     */
    @Get('ready')
    @HealthCheck()
    ready(): Promise<HealthCheckResult> {
        return this.healthCheckService.check([]);
    }
}

/**
 * Health Module — Health Check Endpoint
 *
 * Provides the unauthenticated health check endpoint.
 * Used by load balancers, Kubernetes probes, and the ModuleSetupPage.
 */
import { Module } from '@nestjs/common';
import { HealthController } from '../controllers/health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}

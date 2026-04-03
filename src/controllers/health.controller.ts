/**
 * Health Check Controller
 *
 * Every Zorbit service must expose a health check endpoint at:
 *   GET /api/v1/G/{service}/health
 *
 * This endpoint is:
 *   - NOT authenticated (no JWT required)
 *   - Used by load balancers, Kubernetes probes, and monitoring tools
 *   - Scoped to the Global (G) namespace since it's not org-specific
 *
 * The response should include:
 *   - Service name and version
 *   - Current timestamp
 *   - Uptime
 *   - Status of critical dependencies (database, etc.)
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('health')
@Controller('api/v1/G/sample')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check', description: 'Returns service health status. No authentication required.' })
  @ApiResponse({ status: 200, description: 'Service is healthy.' })
  getHealth() {
    const mongoState = this.mongoConnection.readyState;
    const mongoStatus = mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';

    return {
      service: 'zorbit-app-sample',
      version: '0.1.0',
      status: mongoStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      dependencies: {
        mongodb: mongoStatus,
      },
    };
  }
}

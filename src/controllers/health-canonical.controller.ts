import { Controller, Get } from '@nestjs/common';

/**
 * Canonical health controller — Cycle 105 health-contract standardisation.
 *
 * Exposes the platform-uniform endpoint:
 *   GET /api/v1/G/health  ->  { status: 'ok', service: 'zorbit-app-sample', timestamp: <iso> }
 *
 * This controller is ADDITIVE — any pre-existing per-service health endpoint
 * (e.g. /api/v1/G/<svc>/health) remains in place for backward compatibility.
 *
 * Soldier (m) per MSG-065 + (h) finding 18:33 +07.
 */
@Controller('api/v1/G')
export class HealthCanonicalController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'zorbit-app-sample',
      timestamp: new Date().toISOString(),
    };
  }
}

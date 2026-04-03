/**
 * Seed Controller — Demo Data Management Endpoints
 *
 * These endpoints are used by the ModuleSetupPage in the unified console
 * to seed and flush demo data. They follow the standard pattern:
 *
 *   POST /api/v1/G/{service}/seed/demo  — Seed demo data
 *   DELETE /api/v1/G/{service}/seed/demo — Flush demo data only
 *   DELETE /api/v1/G/{service}/seed/all  — Flush ALL data
 *
 * In production, these endpoints should be restricted to admin roles.
 * For the sample module, they require JWT authentication but no specific privilege.
 */
import { Controller, Post, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeedService } from '../services/seed.service';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { JwtPayload } from '../middleware/jwt.strategy';

@ApiTags('seed')
@ApiBearerAuth()
@Controller('api/v1/G/sample/seed')
@UseGuards(JwtAuthGuard)
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('demo')
  @ApiOperation({
    summary: 'Seed demo tasks',
    description: 'Creates 10 sample tasks with various statuses and priorities for demo purposes.',
  })
  @ApiResponse({ status: 201, description: 'Demo data seeded.' })
  async seedDemo(@Req() req: { user: JwtPayload }) {
    return this.seedService.seedDemo(req.user.org);
  }

  @Delete('demo')
  @ApiOperation({
    summary: 'Flush demo tasks',
    description: 'Removes only demo-seeded tasks (created by U-SEED). Real user data is preserved.',
  })
  @ApiResponse({ status: 200, description: 'Demo data flushed.' })
  async flushDemo(@Req() req: { user: JwtPayload }) {
    return this.seedService.flushDemo(req.user.org);
  }

  @Delete('all')
  @ApiOperation({
    summary: 'Flush ALL tasks',
    description: 'Removes ALL tasks for the organization. Destructive — use with caution.',
  })
  @ApiResponse({ status: 200, description: 'All data flushed.' })
  async flushAll(@Req() req: { user: JwtPayload }) {
    return this.seedService.flushAll(req.user.org);
  }
}

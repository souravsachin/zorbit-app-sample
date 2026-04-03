/**
 * JWT Authentication Guard
 *
 * Apply this guard to any controller or route that requires authentication.
 * It uses the Passport 'jwt' strategy defined in JwtStrategy.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Controller('api/v1/O/:orgId/tasks')
 *   export class TaskController { ... }
 *
 * After this guard runs successfully:
 *   - request.user contains the decoded JwtPayload
 *   - request.user.sub = user hash ID
 *   - request.user.org = organization hash ID
 *   - request.user.privileges = user's privilege list
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

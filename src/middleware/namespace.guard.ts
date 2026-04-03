/**
 * Namespace Isolation Guard
 *
 * Zorbit enforces strict namespace isolation. Every request is scoped to a namespace:
 *   G = Global (platform-wide, e.g. health checks)
 *   O = Organization (the most common scope for business data)
 *   D = Department (sub-organization scope)
 *   U = User (personal scope)
 *
 * This guard ensures that the orgId in the URL matches the org claim in the JWT.
 * Without this guard, a user from organization O-AAAA could access data belonging
 * to organization O-BBBB by simply changing the URL parameter.
 *
 * HOW TO USE:
 *   @UseGuards(JwtAuthGuard, NamespaceGuard)
 *   @Controller('api/v1/O/:orgId/tasks')
 *
 * The guard runs AFTER JwtAuthGuard, so request.user is guaranteed to exist.
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class NamespaceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const params = request.params;

    // Organization namespace check: URL orgId must match JWT org claim
    if (params.orgId && params.orgId !== user.org) {
      throw new ForbiddenException(
        `Access denied: you belong to org ${user.org}, cannot access org ${params.orgId}`,
      );
    }

    return true;
  }
}

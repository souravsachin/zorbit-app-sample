/**
 * JWT Passport Strategy — Validates tokens issued by zorbit-identity
 *
 * HOW IT WORKS:
 *   1. The client sends a request with `Authorization: Bearer <token>`
 *   2. Passport extracts the token from the header
 *   3. The token is verified using JWT_SECRET (must match zorbit-identity's secret)
 *   4. If valid, the `validate()` method is called with the decoded payload
 *   5. The returned object is attached to `request.user`
 *
 * WHY THIS PATTERN:
 *   Zorbit uses a shared JWT_SECRET across all services. The identity service
 *   signs tokens, and every other service validates them using the same secret.
 *   This means your module does NOT need to call the identity service on every
 *   request — the JWT is self-contained and verifiable locally.
 *
 * IMPORTANT: If JWT_SECRET doesn't match the identity service's secret,
 *   ALL authenticated requests will fail with 401 Unauthorized.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT payload structure issued by zorbit-identity.
 * Every Zorbit service can rely on these fields being present.
 */
export interface JwtPayload {
  /** User short hash ID (e.g. 'U-81F3') */
  sub: string;
  /** Organization short hash ID (e.g. 'O-92AF') */
  org: string;
  /** Token type: 'access' for API calls, 'refresh' for token renewal */
  type: 'access' | 'refresh';
  /** User's assigned privileges (e.g. ['pii:detokenize', 'task:create']) */
  privileges?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Extract JWT from the Authorization: Bearer <token> header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject expired tokens (zorbit-identity sets expiration)
      ignoreExpiration: false,
      // MUST match the secret used by zorbit-identity to sign tokens
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev-secret-change-in-production'),
    });
  }

  /**
   * Called after JWT signature is verified.
   * The returned value becomes `request.user` on all subsequent guards and handlers.
   *
   * We only accept 'access' tokens here — refresh tokens should only be used
   * with the identity service's /auth/refresh endpoint.
   */
  validate(payload: JwtPayload): JwtPayload {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type — expected access token');
    }
    return payload;
  }
}

/**
 * Zorbit Platform Service URLs Configuration
 *
 * This file centralizes all platform service URLs used by this module.
 * In a Zorbit business module, you NEVER import code from platform repos.
 * Instead, you call platform services via REST APIs using these URLs.
 *
 * URL resolution order:
 *   1. Environment variable (from .env)
 *   2. Default value (localhost development ports)
 *
 * Production note: In production, these URLs typically point to internal
 * service mesh addresses or nginx reverse proxy paths, not localhost.
 */
import { ConfigService } from '@nestjs/config';

export interface ZorbitServiceUrls {
  /** zorbit-identity — JWT authentication, user management, organization management */
  identity: string;
  /** zorbit-authorization — roles, privileges, access control */
  authorization: string;
  /** zorbit-pii-vault — PII tokenization and detokenization */
  piiVault: string;
  /** zorbit-navigation — dynamic menu items and route registration */
  navigation: string;
  /** zorbit-audit — audit event trail */
  audit: string;
}

/**
 * Build the platform service URLs from environment configuration.
 * Call this from any service that needs to make REST calls to the platform.
 */
export function getZorbitServiceUrls(config: ConfigService): ZorbitServiceUrls {
  return {
    identity: config.get<string>('IDENTITY_SERVICE_URL', 'http://localhost:3099'),
    authorization: config.get<string>('AUTHORIZATION_SERVICE_URL', 'http://localhost:3102'),
    piiVault: config.get<string>('PII_VAULT_SERVICE_URL', 'http://localhost:3105'),
    navigation: config.get<string>('NAVIGATION_SERVICE_URL', 'http://localhost:3103'),
    audit: config.get<string>('AUDIT_SERVICE_URL', 'http://localhost:3106'),
  };
}

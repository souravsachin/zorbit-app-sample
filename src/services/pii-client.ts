/**
 * PII Vault REST Client
 *
 * This is a REST client for the zorbit-pii-vault service. It is NOT a library import.
 * The PII Vault is a separate microservice that stores sensitive data (names, emails,
 * phone numbers, etc.) and returns opaque tokens.
 *
 * HOW PII WORKS IN ZORBIT:
 *
 *   1. Client sends: { assigneeName: "Jane Smith", assigneeEmail: "jane@co.com" }
 *   2. Your service calls PII Vault: POST /api/v1/G/pii/tokenize
 *   3. PII Vault returns: { token: "PII-92AF" }
 *   4. Your service stores: { assigneeNameToken: "PII-92AF" } in YOUR database
 *   5. Raw PII ("Jane Smith") lives ONLY in the PII Vault's encrypted storage
 *
 * WHY:
 *   - Compliance (GDPR, HIPAA, etc.) — PII is centralized and auditable
 *   - Right to be forgotten — delete from vault, all services lose access
 *   - Access control — only users with pii:detokenize privilege can see raw values
 *   - Breach containment — if your service DB is compromised, no PII is exposed
 *
 * IMPORTANT: Every PII vault call must forward the user's JWT bearer token.
 *   The vault authenticates all requests and logs who accessed what PII.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class PiiVaultClient {
  private readonly logger = new Logger(PiiVaultClient.name);
  private readonly httpClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>(
      'PII_VAULT_SERVICE_URL',
      'http://localhost:3105',
    );
    this.httpClient = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  /**
   * Tokenize a raw PII value.
   *
   * @param dataType - Type of PII (e.g. 'name', 'email', 'phone')
   * @param value - The raw PII value to tokenize
   * @param organizationHashId - Organization context (PII is org-scoped)
   * @param bearerToken - JWT token to forward for authentication
   * @returns PII token string (e.g. 'PII-92AF')
   *
   * @example
   *   const token = await piiClient.tokenize('email', 'jane@co.com', 'O-92AF', jwtToken);
   *   // token = 'PII-A3B7'
   *   // Store 'PII-A3B7' in your database, NOT 'jane@co.com'
   */
  async tokenize(
    dataType: string,
    value: string,
    organizationHashId: string,
    bearerToken: string,
  ): Promise<string> {
    try {
      const response = await this.httpClient.post(
        '/api/v1/G/pii/tokenize',
        { dataType, value, organizationHashId },
        { headers: { Authorization: `Bearer ${bearerToken}` } },
      );
      return response.data.token;
    } catch (error) {
      this.logger.error(`Failed to tokenize ${dataType}`, (error as Error)?.message || error);
      throw error;
    }
  }

  /**
   * Detokenize a PII token back to the raw value.
   *
   * IMPORTANT: Only call this if the requesting user has the pii:detokenize privilege.
   * The PII Vault will also enforce this on its end, but checking privileges first
   * avoids unnecessary network calls.
   *
   * @param token - PII token (e.g. 'PII-92AF')
   * @param bearerToken - JWT token to forward for authentication
   * @returns The raw PII value
   *
   * @example
   *   const email = await piiClient.detokenize('PII-A3B7', jwtToken);
   *   // email = 'jane@co.com'
   */
  async detokenize(token: string, bearerToken: string): Promise<string> {
    try {
      const response = await this.httpClient.post(
        '/api/v1/G/pii/detokenize',
        { token },
        { headers: { Authorization: `Bearer ${bearerToken}` } },
      );
      return response.data.value;
    } catch (error) {
      this.logger.error(`Failed to detokenize token ${token}`, (error as Error)?.message || error);
      throw error;
    }
  }
}

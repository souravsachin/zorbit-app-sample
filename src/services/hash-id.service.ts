/**
 * Short Hash Identifier Service
 *
 * Zorbit uses short hash identifiers instead of sequential IDs or UUIDs.
 * Pattern: PREFIX-HASH (e.g. TSK-A2F3, O-92AF, U-81F3)
 *
 * Properties:
 *   - Immutable — once assigned, never changes
 *   - Globally unique — best-effort via crypto.randomBytes
 *   - Non-sequential — cannot be guessed or enumerated
 *   - Human-readable — short enough to appear in URLs and logs
 *
 * For your module, choose a unique 2-4 character prefix:
 *   TSK  = Task
 *   CUS  = Customer
 *   CLM  = Claim
 *   ORD  = Order
 *   INV  = Invoice
 */
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class HashIdService {
  /**
   * Generate a short hash identifier.
   * @param prefix - Entity prefix (e.g. 'TSK' for tasks)
   * @returns Identifier like 'TSK-A2F3'
   */
  generate(prefix: string): string {
    // 2 random bytes = 4 hex characters = 65,536 possible values per prefix
    // For higher collision resistance, increase to 3 bytes (6 hex chars)
    const bytes = randomBytes(2);
    const hash = bytes.toString('hex').toUpperCase();
    return `${prefix}-${hash}`;
  }
}

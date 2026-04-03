/**
 * Task Domain Events
 *
 * Zorbit event naming convention: domain.entity.action
 *
 * Examples from other modules:
 *   customer.customer.created
 *   claims.claim.intimated
 *   identity.user.registered
 *
 * For this module:
 *   sample.task.created
 *   sample.task.updated
 *   sample.task.deleted
 *   sample.task.status_changed
 *
 * Events are published to Kafka topics. The topic name is derived from the
 * event type by replacing dots with dashes: sample.task.created -> sample-task-created
 */
export const TaskEvents = {
  TASK_CREATED: 'sample.task.created',
  TASK_UPDATED: 'sample.task.updated',
  TASK_DELETED: 'sample.task.deleted',
  TASK_STATUS_CHANGED: 'sample.task.status_changed',
} as const;

export type TaskEventType = (typeof TaskEvents)[keyof typeof TaskEvents];

/**
 * Canonical Zorbit Event Envelope
 *
 * Every event published to Kafka MUST follow this envelope structure.
 * This allows platform services (audit, observability) to process events
 * uniformly regardless of which module published them.
 */
export interface ZorbitEventEnvelope<T = unknown> {
  /** Unique event ID (UUID v4) */
  eventId: string;
  /** Event type following domain.entity.action convention */
  eventType: string;
  /** ISO 8601 timestamp of when the event occurred */
  timestamp: string;
  /** Service name that published the event */
  source: string;
  /** Namespace scope: G, O, D, or U */
  namespace: string;
  /** Namespace identifier (e.g. O-92AF) */
  namespaceId: string;
  /** Event-specific payload */
  payload: T;
  /** Optional metadata (correlation ID, trace ID, etc.) */
  metadata?: Record<string, string>;
}

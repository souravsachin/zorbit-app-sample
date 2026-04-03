/**
 * Event Publisher Service — Kafka Integration
 *
 * Publishes domain events to Kafka following the Zorbit canonical event envelope.
 *
 * GRACEFUL DEGRADATION:
 *   When KAFKA_ENABLED=false (default), events are logged to console but not
 *   published. This allows local development without Kafka infrastructure.
 *   The service methods never throw — failed publishes are logged as warnings.
 *
 * TOPIC NAMING:
 *   Event types use dots (sample.task.created) but Kafka topics use dashes
 *   (sample-task-created). The conversion happens automatically in this service.
 */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { createKafkaConfig, KafkaConfig } from '../config/kafka.config';
import { ZorbitEventEnvelope } from './task-events';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private producer: Producer | null = null;
  private kafkaConfig: KafkaConfig;

  constructor(private readonly configService: ConfigService) {
    this.kafkaConfig = createKafkaConfig(configService);
  }

  /**
   * Connect to Kafka on module initialization.
   * Fails gracefully — the service works without Kafka.
   */
  async onModuleInit(): Promise<void> {
    if (!this.kafkaConfig.enabled) {
      this.logger.log('Kafka disabled (KAFKA_ENABLED=false) — events will be logged to console');
      return;
    }

    try {
      const kafka = new Kafka({
        clientId: this.kafkaConfig.clientId,
        brokers: this.kafkaConfig.brokers,
      });
      this.producer = kafka.producer();
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.warn('Kafka connection failed — events will be logged to console', error);
      this.producer = null;
    }
  }

  /**
   * Disconnect from Kafka on module shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.producer?.disconnect();
    } catch {
      // Swallow errors on shutdown
    }
  }

  /**
   * Publish a domain event.
   *
   * @param eventType - Event name (e.g. 'sample.task.created')
   * @param namespace - Namespace scope (e.g. 'O')
   * @param namespaceId - Namespace ID (e.g. 'O-92AF')
   * @param payload - Event-specific data
   *
   * This method NEVER throws. Failed publishes are logged as warnings.
   * Business logic should not depend on event publishing succeeding.
   */
  async publish<T>(
    eventType: string,
    namespace: string,
    namespaceId: string,
    payload: T,
  ): Promise<void> {
    const envelope: ZorbitEventEnvelope<T> = {
      eventId: uuidv4(),
      eventType,
      timestamp: new Date().toISOString(),
      source: 'zorbit-app-sample',
      namespace,
      namespaceId,
      payload,
    };

    // Convert event type to Kafka topic: sample.task.created -> sample-task-created
    const topic = eventType.replace(/\./g, '-');

    // If Kafka is disabled or not connected, just log the event
    if (!this.producer) {
      this.logger.debug(`[Event] ${eventType} | ${JSON.stringify(payload)}`);
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: namespaceId,
            value: JSON.stringify(envelope),
          },
        ],
      });
      this.logger.debug(`Published event ${eventType} to topic ${topic}`);
    } catch (error) {
      this.logger.warn(`Failed to publish event ${eventType} — continuing without event`, error);
    }
  }
}

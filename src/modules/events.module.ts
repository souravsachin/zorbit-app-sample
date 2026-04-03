/**
 * Events Module — Kafka Event Publisher
 *
 * Provides the EventPublisherService as a global singleton.
 * The publisher gracefully degrades when Kafka is not available.
 */
import { Module, Global } from '@nestjs/common';
import { EventPublisherService } from '../events/event-publisher.service';

@Global()
@Module({
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class EventsModule {}

/**
 * Kafka Configuration
 *
 * Kafka is OPTIONAL for Zorbit business modules. When KAFKA_ENABLED=false,
 * the event publisher logs events to console instead of publishing to Kafka.
 *
 * This allows developers to run their module locally without Kafka infrastructure
 * while still seeing what events would be published.
 */
import { ConfigService } from '@nestjs/config';

export interface KafkaConfig {
  enabled: boolean;
  brokers: string[];
  clientId: string;
  groupId: string;
}

export function createKafkaConfig(configService: ConfigService): KafkaConfig {
  const enabled = configService.get<string>('KAFKA_ENABLED', 'false') === 'true';
  const brokersRaw = configService.get<string>('KAFKA_BROKER', 'localhost:9092');

  return {
    enabled,
    brokers: brokersRaw.split(',').map((b) => b.trim()),
    clientId: configService.get<string>('KAFKA_CLIENT_ID', 'zorbit-app-sample'),
    groupId: configService.get<string>('KAFKA_GROUP_ID', 'zorbit-app-sample-group'),
  };
}

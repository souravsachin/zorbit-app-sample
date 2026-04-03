/**
 * zorbit-app-sample — Root Application Module
 *
 * This is the NestJS root module that wires together all sub-modules.
 *
 * Module registration order:
 *   1. ConfigModule  — loads .env variables (isGlobal makes them available everywhere)
 *   2. MongooseModule — connects to this module's own MongoDB database
 *   3. AuthModule     — JWT validation middleware (shared JWT_SECRET with zorbit-identity)
 *   4. EventsModule   — Kafka event publisher (optional, gracefully disabled if Kafka is off)
 *   5. TaskModule     — the business logic module (CRUD, PII, etc.)
 *   6. HealthModule   — health check endpoint
 *   7. SeedModule     — demo data seeding
 *
 * IMPORTANT: Each Zorbit module connects to its OWN database. Never share databases
 * between services. Cross-service communication happens only via REST APIs or Kafka events.
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth.module';
import { EventsModule } from './modules/events.module';
import { TaskModule } from './modules/task.module';
import { HealthModule } from './modules/health.module';
import { SeedModule } from './modules/seed.module';

@Module({
  imports: [
    // 1. Configuration — loads .env file, available globally via ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. MongoDB — each module gets its own database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'MONGO_URI',
          'mongodb://127.0.0.1:27018/zorbit_sample_tasks?directConnection=true',
        ),
      }),
    }),

    // 3. Auth — JWT validation using the platform's shared secret
    AuthModule,

    // 4. Events — Kafka publisher (gracefully no-ops when KAFKA_ENABLED=false)
    EventsModule,

    // 5. Business logic — Task CRUD with PII vault integration
    TaskModule,

    // 6. Health check — unauthenticated, used by load balancers and monitoring
    HealthModule,

    // 7. Seed — demo data management
    SeedModule,
  ],
})
export class AppModule {}

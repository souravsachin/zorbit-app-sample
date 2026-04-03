/**
 * zorbit-app-sample — Application Entry Point
 *
 * This is the bootstrap file for a Zorbit business module. It:
 *   1. Initializes OpenTelemetry (optional, for observability)
 *   2. Creates the NestJS application
 *   3. Configures global validation pipes (whitelist + transform)
 *   4. Enables CORS for the unified console frontend
 *   5. Sets up Swagger API documentation at /api-docs
 *   6. Starts listening on the configured port
 *
 * Port convention:
 *   Development: 3040
 *   Server:      3140 (default + 100 offset)
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  initOpenTelemetry();

  const app = await NestFactory.create(AppModule);

  // Global validation: strip unknown properties, auto-transform types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — allow the unified console and any configured origins
  const configService = app.get(ConfigService);
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:5173');
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
  });

  // Swagger API documentation — available at /api-docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Zorbit Sample — Task Management')
    .setDescription(
      'Reference implementation of a Zorbit business module. ' +
      'Demonstrates JWT auth, PII vault integration, namespace isolation, ' +
      'Kafka event publishing, and the standard list endpoint pattern.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('tasks', 'Task CRUD operations within organizations')
    .addTag('health', 'Service health monitoring')
    .addTag('seed', 'Demo data seeding and cleanup')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get<number>('PORT', 3040);
  await app.listen(port);
  console.log(`zorbit-app-sample listening on port ${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api-docs`);
}

/**
 * Initialize OpenTelemetry for distributed tracing.
 * When configured, traces propagate across all Zorbit platform services.
 */
function initOpenTelemetry(): void {
  // TODO: Enable when OTEL_EXPORTER_OTLP_ENDPOINT is configured
  // const sdk = new NodeSDK({
  //   serviceName: process.env.OTEL_SERVICE_NAME || 'zorbit-app-sample',
  //   traceExporter: new OTLPTraceExporter({
  //     url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  //   }),
  // });
  // sdk.start();
}

bootstrap();

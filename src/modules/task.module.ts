/**
 * Task Module — Business Logic
 *
 * This module encapsulates all task-related functionality:
 *   - TaskController — REST API endpoints
 *   - TaskService — CRUD operations with PII and event integration
 *   - PiiVaultClient — REST client for the PII Vault service
 *   - HashIdService — Short hash ID generation
 *   - Mongoose schema registration for the Task model
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from '../models/schemas/task.schema';
import { TaskController } from '../controllers/task.controller';
import { TaskService } from '../services/task.service';
import { PiiVaultClient } from '../services/pii-client';
import { HashIdService } from '../services/hash-id.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
  ],
  controllers: [TaskController],
  providers: [TaskService, PiiVaultClient, HashIdService],
  exports: [TaskService],
})
export class TaskModule {}

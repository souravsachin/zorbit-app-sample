/**
 * Seed Module — Demo Data Management
 *
 * Provides seed and flush endpoints for demo data.
 * The ModuleSetupPage in the unified console calls these endpoints.
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from '../models/schemas/task.schema';
import { SeedController } from '../controllers/seed.controller';
import { SeedService } from '../services/seed.service';
import { HashIdService } from '../services/hash-id.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
  ],
  controllers: [SeedController],
  providers: [SeedService, HashIdService],
})
export class SeedModule {}

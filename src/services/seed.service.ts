/**
 * Seed Service — Demo Data Management
 *
 * Every Zorbit module should provide seed capabilities:
 *   1. Seed system data (roles, privileges, configs required for the module to work)
 *   2. Seed demo data (sample records for testing and demos)
 *   3. Flush demo data (remove demo records without affecting real data)
 *   4. Flush all data (nuclear option — removes everything)
 *
 * The ModuleSetupPage in the unified console calls these endpoints
 * to manage data for each module.
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from '../models/schemas/task.schema';
import { HashIdService } from './hash-id.service';

/** Demo tasks to seed — covers all statuses and priorities */
const DEMO_TASKS = [
  {
    title: 'Set up development environment',
    description: 'Install Node.js 20+, MongoDB, and clone the repository. Follow the README quickstart guide.',
    status: 'done',
    priority: 'high',
    tags: ['onboarding', 'setup'],
  },
  {
    title: 'Review Q1 financial report',
    description: 'Check revenue figures against projections and highlight any discrepancies in the variance column.',
    status: 'review',
    priority: 'critical',
    tags: ['finance', 'quarterly'],
  },
  {
    title: 'Update API documentation',
    description: 'Add Swagger decorators to all new endpoints and update the API.md reference document.',
    status: 'in_progress',
    priority: 'medium',
    tags: ['documentation', 'api'],
  },
  {
    title: 'Implement email notification service',
    description: 'Build the notification pipeline: event -> queue -> template engine -> SMTP delivery.',
    status: 'todo',
    priority: 'high',
    tags: ['feature', 'notifications'],
  },
  {
    title: 'Fix pagination bug on task list',
    description: 'The last page shows duplicates when total count is not evenly divisible by page size.',
    status: 'in_progress',
    priority: 'high',
    tags: ['bug', 'ui'],
  },
  {
    title: 'Design database migration strategy',
    description: 'Plan how schema changes will be rolled out without downtime. Consider blue-green deployment.',
    status: 'todo',
    priority: 'medium',
    tags: ['architecture', 'database'],
  },
  {
    title: 'Write unit tests for task service',
    description: 'Cover all CRUD operations, status transitions, and PII tokenization paths.',
    status: 'todo',
    priority: 'medium',
    tags: ['testing'],
  },
  {
    title: 'Prepare demo for stakeholder meeting',
    description: 'Create a walkthrough showing task creation, assignment, status workflow, and PII masking.',
    status: 'review',
    priority: 'critical',
    tags: ['demo', 'presentation'],
  },
  {
    title: 'Optimize MongoDB query performance',
    description: 'Add compound indexes for the most common query patterns. Profile slow queries.',
    status: 'todo',
    priority: 'low',
    tags: ['performance', 'database'],
  },
  {
    title: 'Configure CI/CD pipeline',
    description: 'Set up GitHub Actions for lint, test, build, and deploy to staging.',
    status: 'done',
    priority: 'high',
    tags: ['devops', 'ci-cd'],
  },
];

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    private readonly hashIdService: HashIdService,
  ) {}

  /**
   * Seed demo task records.
   * Uses a fixed organizationHashId so the seeded data appears for any logged-in user.
   */
  async seedDemo(organizationHashId: string): Promise<{ seeded: number }> {
    const tasks = DEMO_TASKS.map((t) => ({
      hashId: this.hashIdService.generate('TSK'),
      organizationHashId,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      tags: t.tags,
      assigneeNameToken: null,
      assigneeEmailToken: null,
      assigneeHashId: null,
      dueDate: null,
      createdByHashId: 'U-SEED',
    }));

    await this.taskModel.insertMany(tasks);
    this.logger.log(`Seeded ${tasks.length} demo tasks for org ${organizationHashId}`);
    return { seeded: tasks.length };
  }

  /**
   * Remove demo data (created by U-SEED) without affecting real user data.
   */
  async flushDemo(organizationHashId: string): Promise<{ deleted: number }> {
    const result = await this.taskModel.deleteMany({
      organizationHashId,
      createdByHashId: 'U-SEED',
    }).exec();
    this.logger.log(`Flushed ${result.deletedCount} demo tasks for org ${organizationHashId}`);
    return { deleted: result.deletedCount };
  }

  /**
   * Remove ALL tasks for an organization. Use with caution.
   */
  async flushAll(organizationHashId: string): Promise<{ deleted: number }> {
    const result = await this.taskModel.deleteMany({ organizationHashId }).exec();
    this.logger.log(`Flushed ALL ${result.deletedCount} tasks for org ${organizationHashId}`);
    return { deleted: result.deletedCount };
  }
}

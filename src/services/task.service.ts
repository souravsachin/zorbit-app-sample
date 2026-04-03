/**
 * Task Service — Core Business Logic
 *
 * This is the main service for the Task Management module. It demonstrates
 * all Zorbit platform integration patterns:
 *
 *   1. NAMESPACE ISOLATION — Every query filters by organizationHashId
 *   2. SHORT HASH IDs — Tasks get TSK-XXXX identifiers
 *   3. PII TOKENIZATION — Assignee name/email stored as vault tokens
 *   4. EVENT PUBLISHING — Domain events published to Kafka
 *   5. STANDARD LIST ENDPOINT — Pagination, sort, filter, search, field projection
 *
 * The Standard List Endpoint is the most important pattern. It provides:
 *   - Pagination: page + limit (default: page 1, limit 20)
 *   - Sorting: sortBy + sortOrder (default: createdAt desc)
 *   - Filtering: status, priority, assigneeHashId, tags
 *   - Search: full-text search across title and description
 *   - Field projection: only return requested fields
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, SortOrder } from 'mongoose';
import { Task, TaskDocument } from '../models/schemas/task.schema';
import { CreateTaskDto } from '../models/dto/create-task.dto';
import { UpdateTaskDto } from '../models/dto/update-task.dto';
import { HashIdService } from './hash-id.service';
import { PiiVaultClient } from './pii-client';
import { EventPublisherService } from '../events/event-publisher.service';
import { TaskEvents } from '../events/task-events';

/**
 * Standard list response shape — used by all Zorbit list endpoints.
 * The DataTable frontend component expects this exact structure.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Query parameters for the standard list endpoint.
 * These map directly to URL query string parameters.
 */
export interface TaskListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  priority?: string;
  assigneeHashId?: string;
  tags?: string;
  search?: string;
  fields?: string;
}

/**
 * Valid status transitions. Key = current status, Value = allowed next statuses.
 * This prevents invalid transitions like done -> todo.
 */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  todo: ['in_progress'],
  in_progress: ['review', 'todo'],
  review: ['done', 'in_progress'],
  done: ['todo'], // Allow reopening
};

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    private readonly hashIdService: HashIdService,
    private readonly piiVaultClient: PiiVaultClient,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  // -------------------------------------------------------------------------
  // LIST — The Standard List Endpoint (most important pattern in Zorbit)
  // -------------------------------------------------------------------------

  /**
   * List tasks with pagination, sorting, filtering, and search.
   *
   * This implements the Zorbit "standard list endpoint" pattern that every
   * business module should follow. The zorbit-pfs-datatable service and
   * the ZorbitDataTable React component both depend on this response shape.
   *
   * @param orgId - Organization hash ID (namespace isolation)
   * @param query - Query parameters from the URL
   */
  async findAll(orgId: string, query: TaskListQuery): Promise<PaginatedResponse<any>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder: SortOrder = query.sortOrder === 'asc' ? 1 : -1;

    // Build filter — ALWAYS start with organizationHashId for namespace isolation
    const filter: FilterQuery<TaskDocument> = { organizationHashId: orgId };

    // Status filter (supports comma-separated: "todo,in_progress")
    if (query.status) {
      const statuses = query.status.split(',').map((s) => s.trim());
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    // Priority filter
    if (query.priority) {
      const priorities = query.priority.split(',').map((p) => p.trim());
      filter.priority = priorities.length === 1 ? priorities[0] : { $in: priorities };
    }

    // Assignee filter
    if (query.assigneeHashId) {
      filter.assigneeHashId = query.assigneeHashId;
    }

    // Tag filter (any of the specified tags)
    if (query.tags) {
      const tags = query.tags.split(',').map((t) => t.trim());
      filter.tags = { $in: tags };
    }

    // Full-text search across title and description
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Field projection — only return requested fields
    let projection: Record<string, 1> | undefined;
    if (query.fields) {
      projection = {};
      for (const field of query.fields.split(',').map((f) => f.trim())) {
        projection[field] = 1;
      }
      // Always include hashId and organizationHashId
      projection['hashId'] = 1;
      projection['organizationHashId'] = 1;
    }

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.taskModel
        .find(filter, projection)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.taskModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // -------------------------------------------------------------------------
  // GET ONE
  // -------------------------------------------------------------------------

  /**
   * Get a single task by hash ID.
   * Optionally detokenizes PII if the caller has the pii:detokenize privilege.
   */
  async findOne(
    orgId: string,
    taskHashId: string,
    canDetokenize = false,
    bearerToken?: string,
  ): Promise<any> {
    const task = await this.taskModel
      .findOne({ hashId: taskHashId, organizationHashId: orgId })
      .lean()
      .exec();

    if (!task) {
      throw new NotFoundException(`Task ${taskHashId} not found in organization ${orgId}`);
    }

    const response: any = { ...task };

    // Detokenize PII only if caller has the privilege
    if (canDetokenize && bearerToken) {
      try {
        if (task.assigneeNameToken) {
          response.assigneeName = await this.piiVaultClient.detokenize(
            task.assigneeNameToken,
            bearerToken,
          );
        }
        if (task.assigneeEmailToken) {
          response.assigneeEmail = await this.piiVaultClient.detokenize(
            task.assigneeEmailToken,
            bearerToken,
          );
        }
      } catch (error) {
        this.logger.warn('PII detokenization failed — returning response without PII', error);
      }
    }

    return response;
  }

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  /**
   * Create a new task. Tokenizes PII fields via the PII Vault.
   *
   * Flow:
   *   1. Generate short hash ID (TSK-XXXX)
   *   2. Tokenize PII fields (assigneeName, assigneeEmail) via PII Vault
   *   3. Save task to MongoDB with PII tokens (not raw values)
   *   4. Publish task.task.created event to Kafka
   */
  async create(
    orgId: string,
    dto: CreateTaskDto,
    createdByHashId: string,
    bearerToken: string,
  ): Promise<any> {
    const hashId = this.hashIdService.generate('TSK');

    // Tokenize PII via the PII Vault — raw values never touch our database
    let assigneeNameToken: string | null = null;
    let assigneeEmailToken: string | null = null;

    if (dto.assigneeName) {
      assigneeNameToken = await this.piiVaultClient.tokenize(
        'name',
        dto.assigneeName,
        orgId,
        bearerToken,
      );
    }

    if (dto.assigneeEmail) {
      assigneeEmailToken = await this.piiVaultClient.tokenize(
        'email',
        dto.assigneeEmail,
        orgId,
        bearerToken,
      );
    }

    const task = new this.taskModel({
      hashId,
      organizationHashId: orgId,
      title: dto.title,
      description: dto.description || '',
      status: 'todo',
      priority: dto.priority || 'medium',
      assigneeNameToken,
      assigneeEmailToken,
      assigneeHashId: dto.assigneeHashId || null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      tags: dto.tags || [],
      createdByHashId,
    });

    await task.save();

    // Publish domain event (no-ops gracefully if Kafka is disabled)
    await this.eventPublisher.publish(TaskEvents.TASK_CREATED, 'O', orgId, {
      taskHashId: hashId,
      title: dto.title,
      priority: dto.priority || 'medium',
      organizationHashId: orgId,
      createdByHashId,
    });

    this.logger.log(`Created task ${hashId} in org ${orgId}`);
    return task.toObject();
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  /**
   * Update an existing task. Re-tokenizes PII if those fields are changed.
   * Validates status transitions against the allowed workflow.
   */
  async update(
    orgId: string,
    taskHashId: string,
    dto: UpdateTaskDto,
    bearerToken: string,
  ): Promise<any> {
    const task = await this.taskModel
      .findOne({ hashId: taskHashId, organizationHashId: orgId })
      .exec();

    if (!task) {
      throw new NotFoundException(`Task ${taskHashId} not found in organization ${orgId}`);
    }

    // Validate status transition
    if (dto.status && dto.status !== task.status) {
      const allowed = STATUS_TRANSITIONS[task.status] || [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Invalid status transition: ${task.status} -> ${dto.status}. ` +
          `Allowed transitions: ${allowed.join(', ')}`,
        );
      }
      task.status = dto.status;
    }

    // Update simple fields
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.assigneeHashId !== undefined) task.assigneeHashId = dto.assigneeHashId;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.tags !== undefined) task.tags = dto.tags;

    // Re-tokenize PII if changed
    if (dto.assigneeName !== undefined) {
      task.assigneeNameToken = dto.assigneeName
        ? await this.piiVaultClient.tokenize('name', dto.assigneeName, orgId, bearerToken)
        : null;
    }
    if (dto.assigneeEmail !== undefined) {
      task.assigneeEmailToken = dto.assigneeEmail
        ? await this.piiVaultClient.tokenize('email', dto.assigneeEmail, orgId, bearerToken)
        : null;
    }

    await task.save();

    await this.eventPublisher.publish(TaskEvents.TASK_UPDATED, 'O', orgId, {
      taskHashId,
      updatedFields: Object.keys(dto),
    });

    this.logger.log(`Updated task ${taskHashId} in org ${orgId}`);
    return task.toObject();
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  /**
   * Delete a task from the organization.
   * Note: PII tokens in the vault are NOT automatically deleted.
   * In production, you may want to call PII Vault's delete endpoint too.
   */
  async remove(orgId: string, taskHashId: string): Promise<void> {
    const result = await this.taskModel
      .deleteOne({ hashId: taskHashId, organizationHashId: orgId })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Task ${taskHashId} not found in organization ${orgId}`);
    }

    await this.eventPublisher.publish(TaskEvents.TASK_DELETED, 'O', orgId, {
      taskHashId,
    });

    this.logger.log(`Deleted task ${taskHashId} from org ${orgId}`);
  }

  // -------------------------------------------------------------------------
  // STATS (bonus — useful for dashboards)
  // -------------------------------------------------------------------------

  /**
   * Get task statistics for the organization.
   * Useful for dashboard widgets and summary cards.
   */
  async getStats(orgId: string): Promise<any> {
    const [statusCounts, priorityCounts, total] = await Promise.all([
      this.taskModel.aggregate([
        { $match: { organizationHashId: orgId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).exec(),
      this.taskModel.aggregate([
        { $match: { organizationHashId: orgId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]).exec(),
      this.taskModel.countDocuments({ organizationHashId: orgId }).exec(),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(statusCounts.map((s: any) => [s._id, s.count])),
      byPriority: Object.fromEntries(priorityCounts.map((p: any) => [p._id, p.count])),
    };
  }
}

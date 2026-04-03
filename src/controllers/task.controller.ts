/**
 * Task Controller — REST API Endpoints
 *
 * This controller demonstrates the standard Zorbit REST API patterns:
 *
 *   URI STRUCTURE: /api/v1/{namespace}/{namespace_id}/resource
 *   Example:       /api/v1/O/O-92AF/tasks
 *
 *   GUARDS: JwtAuthGuard + NamespaceGuard on every route
 *   SWAGGER: Full API documentation via decorators
 *
 * STANDARD LIST ENDPOINT (GET /):
 *   The most important endpoint. Supports pagination, sorting, filtering, search,
 *   and field projection via query parameters. The DataTable frontend component
 *   calls this endpoint directly.
 *
 *   Query Parameters:
 *     ?page=1&limit=20           — Pagination
 *     ?sortBy=createdAt&sortOrder=desc — Sorting
 *     ?status=todo,in_progress   — Filter by status (comma-separated)
 *     ?priority=high,critical    — Filter by priority
 *     ?assigneeHashId=U-81F3    — Filter by assignee
 *     ?tags=finance,urgent       — Filter by tags
 *     ?search=quarterly          — Full-text search
 *     ?fields=hashId,title,status — Field projection
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TaskService, TaskListQuery } from '../services/task.service';
import { CreateTaskDto } from '../models/dto/create-task.dto';
import { UpdateTaskDto } from '../models/dto/update-task.dto';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { NamespaceGuard } from '../middleware/namespace.guard';
import { JwtPayload } from '../middleware/jwt.strategy';

/**
 * Extract the raw JWT token from the Authorization header.
 * Needed for forwarding to PII Vault and other platform services.
 */
function extractToken(authHeader?: string): string {
  if (!authHeader) return '';
  const parts = authHeader.split(' ');
  return parts.length === 2 ? parts[1] : '';
}

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('api/v1/O/:orgId/tasks')
@UseGuards(JwtAuthGuard, NamespaceGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // -------------------------------------------------------------------------
  // LIST — Standard List Endpoint
  // -------------------------------------------------------------------------

  @Get()
  @ApiOperation({
    summary: 'List tasks (standard list endpoint)',
    description:
      'Returns paginated tasks with filtering, sorting, and search. ' +
      'This endpoint follows the Zorbit standard list pattern used by the DataTable component.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20, max: 100)', example: 20 })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: createdAt)', example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort direction (default: desc)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (comma-separated)', example: 'todo,in_progress' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority (comma-separated)', example: 'high,critical' })
  @ApiQuery({ name: 'assigneeHashId', required: false, description: 'Filter by assignee user hash ID', example: 'U-81F3' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)', example: 'finance,urgent' })
  @ApiQuery({ name: 'search', required: false, description: 'Full-text search across title and description' })
  @ApiQuery({ name: 'fields', required: false, description: 'Field projection (comma-separated)', example: 'hashId,title,status' })
  @ApiResponse({ status: 200, description: 'Paginated list of tasks.' })
  async findAll(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeHashId') assigneeHashId?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('fields') fields?: string,
  ) {
    const query: TaskListQuery = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      status,
      priority,
      assigneeHashId,
      tags,
      search,
      fields,
    };
    return this.taskService.findAll(orgId, query);
  }

  // -------------------------------------------------------------------------
  // STATS
  // -------------------------------------------------------------------------

  @Get('stats')
  @ApiOperation({ summary: 'Task statistics', description: 'Returns task count breakdown by status and priority.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 200, description: 'Task statistics returned.' })
  async getStats(@Param('orgId') orgId: string) {
    return this.taskService.getStats(orgId);
  }

  // -------------------------------------------------------------------------
  // GET ONE
  // -------------------------------------------------------------------------

  @Get(':taskId')
  @ApiOperation({
    summary: 'Get task by ID',
    description: 'Returns a single task. PII fields are detokenized only if the caller has the pii:detokenize privilege.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'taskId', description: 'Task short hash ID', example: 'TSK-A2F3' })
  @ApiResponse({ status: 200, description: 'Task returned.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async findOne(
    @Param('orgId') orgId: string,
    @Param('taskId') taskId: string,
    @Req() req: { user: JwtPayload },
    @Headers('authorization') authHeader: string,
  ) {
    const canDetokenize = req.user.privileges?.includes('pii:detokenize') ?? false;
    return this.taskService.findOne(orgId, taskId, canDetokenize, extractToken(authHeader));
  }

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create task',
    description: 'Creates a new task. PII fields (assigneeName, assigneeEmail) are tokenized via the PII Vault.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiResponse({ status: 201, description: 'Task created.' })
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateTaskDto,
    @Req() req: { user: JwtPayload },
    @Headers('authorization') authHeader: string,
  ) {
    return this.taskService.create(orgId, dto, req.user.sub, extractToken(authHeader));
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  @Put(':taskId')
  @ApiOperation({
    summary: 'Update task',
    description: 'Updates task fields. PII fields are re-tokenized if changed. Status transitions are validated.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'taskId', description: 'Task short hash ID', example: 'TSK-A2F3' })
  @ApiResponse({ status: 200, description: 'Task updated.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  async update(
    @Param('orgId') orgId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @Headers('authorization') authHeader: string,
  ) {
    return this.taskService.update(orgId, taskId, dto, extractToken(authHeader));
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task', description: 'Permanently deletes a task.' })
  @ApiParam({ name: 'orgId', description: 'Organization short hash ID', example: 'O-92AF' })
  @ApiParam({ name: 'taskId', description: 'Task short hash ID', example: 'TSK-A2F3' })
  @ApiResponse({ status: 204, description: 'Task deleted.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async remove(
    @Param('orgId') orgId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.taskService.remove(orgId, taskId);
  }
}

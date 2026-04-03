/**
 * Update Task DTO — Request validation for PUT /api/v1/O/:orgId/tasks/:taskId
 *
 * All fields are optional — the client sends only the fields being updated.
 * If PII fields (assigneeName, assigneeEmail) are included, they will be
 * re-tokenized via the PII Vault to generate new tokens.
 *
 * STATUS TRANSITIONS:
 *   The `status` field is validated here for format, but the actual transition
 *   rules (e.g. can't go from 'done' to 'todo') are enforced in the service layer.
 */
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Updated task title', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Updated task description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'New status — see lifecycle: todo -> in_progress -> review -> done',
    enum: ['todo', 'in_progress', 'review', 'done'],
  })
  @IsEnum(['todo', 'in_progress', 'review', 'done'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Updated priority',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({
    description: 'New assignee name (PII — will be re-tokenized)',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  assigneeName?: string;

  @ApiPropertyOptional({
    description: 'New assignee email (PII — will be re-tokenized)',
    example: 'john.doe@company.com',
  })
  @IsEmail()
  @IsOptional()
  assigneeEmail?: string;

  @ApiPropertyOptional({
    description: 'New assignee user hash ID',
    example: 'U-92AF',
  })
  @IsString()
  @IsOptional()
  assigneeHashId?: string;

  @ApiPropertyOptional({
    description: 'Updated due date in ISO 8601 format',
    example: '2026-05-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Updated tags',
    example: ['urgent', 'review'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

/**
 * Create Task DTO — Request validation for POST /api/v1/O/:orgId/tasks
 *
 * DTOs (Data Transfer Objects) validate and transform incoming request bodies.
 * class-validator decorators enforce rules; class-transformer handles type coercion.
 *
 * PII HANDLING:
 *   The client sends raw PII (assigneeName, assigneeEmail) in the request.
 *   The service layer tokenizes these via the PII Vault BEFORE storing.
 *   The raw values are NEVER persisted in our database.
 */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Review Q1 financial report',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed task description',
    example: 'Review the Q1 report and highlight discrepancies in the revenue section.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Task priority level',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({
    description: 'Assignee display name (PII — will be tokenized via PII Vault)',
    example: 'Jane Smith',
  })
  @IsString()
  @IsOptional()
  assigneeName?: string;

  @ApiPropertyOptional({
    description: 'Assignee email address (PII — will be tokenized via PII Vault)',
    example: 'jane.smith@company.com',
  })
  @IsEmail()
  @IsOptional()
  assigneeEmail?: string;

  @ApiPropertyOptional({
    description: 'Assignee user hash ID from zorbit-identity',
    example: 'U-81F3',
  })
  @IsString()
  @IsOptional()
  assigneeHashId?: string;

  @ApiPropertyOptional({
    description: 'Task due date in ISO 8601 format',
    example: '2026-04-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    example: ['finance', 'quarterly'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

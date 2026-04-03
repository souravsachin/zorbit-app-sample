/**
 * TaskHubPage — Module Guide / Overview Page
 *
 * Every Zorbit module should have a "Hub" page using the ModuleHubPage component.
 * This provides a 6-tab guide: Introduction, Presentation, Lifecycle, Videos, Resources, Pricing.
 *
 * The Hub page is the first thing users see when they click the module in the sidebar.
 * It explains what the module does, shows the lifecycle workflow, and links to resources.
 */
import React from 'react';
import {
  CheckSquare,
  ListTodo,
  Users,
  Shield,
  BarChart3,
  Clock,
  Tag,
  Search,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';

const TaskHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="sample-tasks"
      moduleName="Task Management (Sample)"
      moduleDescription="Reference implementation of a Zorbit business module — Task CRUD with PII, events, and the standard list endpoint"
      moduleIntro="This sample module demonstrates how to build a business application on the Zorbit platform. It implements task management with all platform patterns: JWT authentication, namespace isolation, PII vault integration, Kafka event publishing, and the standard list endpoint for DataTable compatibility. Use this as your starting template when building new modules."
      icon={CheckSquare}
      capabilities={[
        {
          icon: ListTodo,
          title: 'Task CRUD',
          description: 'Create, read, update, and delete tasks with full validation and Swagger documentation.',
        },
        {
          icon: Shield,
          title: 'PII Protection',
          description: 'Assignee name and email are tokenized via the PII Vault. Raw PII never touches the task database.',
        },
        {
          icon: Users,
          title: 'Namespace Isolation',
          description: 'All data is scoped to the organization. JWT org claim is validated against the URL orgId.',
        },
        {
          icon: Search,
          title: 'Standard List Endpoint',
          description: 'Pagination, sorting, filtering, search, and field projection — compatible with ZorbitDataTable.',
        },
        {
          icon: Tag,
          title: 'Status Workflow',
          description: 'Defined lifecycle: todo -> in_progress -> review -> done, with validated transitions.',
        },
        {
          icon: BarChart3,
          title: 'Statistics Dashboard',
          description: 'Task count breakdowns by status and priority for dashboard widgets.',
        },
      ]}
      targetUsers={[
        { role: 'Platform Developers', desc: 'Use this module as a reference when building new Zorbit business modules.' },
        { role: 'Frontend Developers', desc: 'See how to build list, detail, create, and edit pages for the unified console.' },
        { role: 'DevOps Engineers', desc: 'Follow the deployment guide for PM2, nginx, and environment configuration.' },
        { role: 'Architects', desc: 'Study the patterns for PII, events, namespace isolation, and service communication.' },
      ]}
      lifecycleStages={[
        { label: 'To Do', description: 'Task created and waiting to be picked up by an assignee.', color: '#94a3b8' },
        { label: 'In Progress', description: 'Work has started. The assignee is actively working on the task.', color: '#3b82f6' },
        { label: 'Review', description: 'Work is done and submitted for review or approval.', color: '#a855f7' },
        { label: 'Done', description: 'Task completed and closed. Can be reopened if needed.', color: '#22c55e' },
      ]}
      swaggerUrl="/api/sample/api-docs"
      faqs={[
        {
          question: 'How do I create a new Zorbit business module?',
          answer: 'Clone this repository, rename it, update the entity names (Task -> YourEntity), and follow the README. The structure, auth middleware, PII client, and event publisher are all reusable.',
        },
        {
          question: 'Why are names and emails stored as PII tokens?',
          answer: 'Zorbit centralizes all PII in the PII Vault service. Operational databases store only opaque tokens (like PII-92AF). This ensures compliance with GDPR/HIPAA, enables right-to-be-forgotten, and contains breach impact.',
        },
        {
          question: 'Can I use PostgreSQL instead of MongoDB?',
          answer: 'Yes. Replace @nestjs/mongoose with @nestjs/typeorm and update the schema to use TypeORM entities. The sample-customer-service repo shows the PostgreSQL pattern.',
        },
        {
          question: 'What if I do not have Kafka running?',
          answer: 'Set KAFKA_ENABLED=false in your .env. Events will be logged to console instead of published. Your module works fine without Kafka.',
        },
        {
          question: 'How do I register menu items for my module?',
          answer: 'Use the navigation service API (POST /api/v1/G/navigation/menu-items) or run the scripts/register-menu.sh script. See the deployment guide.',
        },
      ]}
      resources={[
        { label: 'Swagger API Docs', url: '/api/sample/api-docs' },
        { label: 'GitHub Repository', url: 'https://github.com/souravsachin/zorbit-app-sample' },
        { label: 'Zorbit Platform Docs', url: 'https://github.com/souravsachin/zorbit-core' },
      ]}
    />
  );
};

export default TaskHubPage;

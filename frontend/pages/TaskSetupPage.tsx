/**
 * TaskSetupPage — Module Setup / Data Management
 *
 * Uses the shared ModuleSetupPage component to provide:
 *   - Health check status
 *   - Seed demo data button
 *   - Flush demo data button
 *   - Flush all data button (destructive)
 *
 * The endpoints must match the seed.controller.ts routes.
 */
import { ModuleSetupPage } from '../../components/shared/ModuleSetupPage';
import { CheckSquare } from 'lucide-react';

export default function TaskSetupPage() {
  return (
    <ModuleSetupPage
      moduleId="sample-tasks"
      moduleName="Task Management (Sample)"
      icon={CheckSquare}
      seedEndpoint="/api/sample/api/v1/G/sample/seed/demo"
      demoSeedEndpoint="/api/sample/api/v1/G/sample/seed/demo"
      demoFlushEndpoint="/api/sample/api/v1/G/sample/seed/demo"
      flushEndpoint="/api/sample/api/v1/G/sample/seed/all"
      healthEndpoint="/api/sample/api/v1/G/sample/health"
    />
  );
}

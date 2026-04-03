/**
 * TaskDeploymentsPage — Module Deployment History
 *
 * Uses the shared ModuleDeploymentsPage component.
 * Shows deployment history and environment status.
 */
import { ModuleDeploymentsPage } from '../../components/shared/ModuleDeploymentsPage';
import { CheckSquare } from 'lucide-react';

export default function TaskDeploymentsPage() {
  return (
    <ModuleDeploymentsPage
      moduleId="sample-tasks"
      moduleName="Task Management (Sample)"
      icon={CheckSquare}
    />
  );
}

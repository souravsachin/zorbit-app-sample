/**
 * Route Definitions for zorbit-app-sample
 *
 * TO INTEGRATE INTO ZORBIT-UNIFIED-CONSOLE:
 *
 * 1. Copy the frontend/pages/ folder to:
 *    zorbit-unified-console/src/pages/sample-tasks/
 *
 * 2. Add these lazy imports to App.tsx (near the other lazy imports):
 *
 *    const TaskListPage = React.lazy(() => import('./pages/sample-tasks/TaskListPage'));
 *    const TaskCreatePage = React.lazy(() => import('./pages/sample-tasks/TaskCreatePage'));
 *    const TaskEditPage = React.lazy(() => import('./pages/sample-tasks/TaskEditPage'));
 *    const TaskDetailPage = React.lazy(() => import('./pages/sample-tasks/TaskDetailPage'));
 *    const TaskHubPage = React.lazy(() => import('./pages/sample-tasks/TaskHubPage'));
 *    const TaskSetupPage = React.lazy(() => import('./pages/sample-tasks/TaskSetupPage'));
 *    const TaskDeploymentsPage = React.lazy(() => import('./pages/sample-tasks/TaskDeploymentsPage'));
 *
 * 3. Add these routes inside the <Layout> route group in App.tsx:
 *
 *    {/* Sample Tasks Module *\/}
 *    <Route path="sample-tasks" element={<SafeLazy><TaskListPage /></SafeLazy>} />
 *    <Route path="sample-tasks/new" element={<SafeLazy><TaskCreatePage /></SafeLazy>} />
 *    <Route path="sample-tasks/:taskId" element={<SafeLazy><TaskDetailPage /></SafeLazy>} />
 *    <Route path="sample-tasks/:taskId/edit" element={<SafeLazy><TaskEditPage /></SafeLazy>} />
 *    <Route path="sample-tasks/setup" element={<SafeLazy><TaskSetupPage /></SafeLazy>} />
 *    <Route path="sample-tasks/deployments" element={<SafeLazy><TaskDeploymentsPage /></SafeLazy>} />
 *    <Route path="sample-tasks/guide/*" element={<SafeLazy><TaskHubPage /></SafeLazy>} />
 *
 * 4. Add the API proxy to vite.config.ts (for local development):
 *
 *    '/api/sample': {
 *      target: 'http://localhost:3040',
 *      changeOrigin: true,
 *      rewrite: (path) => path.replace(/^\/api\/sample/, ''),
 *    },
 *
 * 5. Add the API config to src/config.ts:
 *
 *    SAMPLE_URL: import.meta.env.VITE_SAMPLE_URL || '/api/sample',
 *
 * 6. Register menu items in the navigation service (see scripts/register-menu.sh)
 */
export {};

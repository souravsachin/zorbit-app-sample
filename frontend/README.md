# Frontend Integration Guide

This folder contains React pages and configuration files for the Task Management module. These files are designed to be copied into the `zorbit-unified-console` repository.

## Quick Integration Steps

### 1. Copy Pages

```bash
cp -r frontend/pages/ \
  ../zorbit-unified-console/src/pages/sample-tasks/
```

### 2. Add Lazy Imports to App.tsx

```tsx
const TaskListPage = React.lazy(() => import('./pages/sample-tasks/TaskListPage'));
const TaskCreatePage = React.lazy(() => import('./pages/sample-tasks/TaskCreatePage'));
const TaskEditPage = React.lazy(() => import('./pages/sample-tasks/TaskEditPage'));
const TaskDetailPage = React.lazy(() => import('./pages/sample-tasks/TaskDetailPage'));
const TaskHubPage = React.lazy(() => import('./pages/sample-tasks/TaskHubPage'));
const TaskSetupPage = React.lazy(() => import('./pages/sample-tasks/TaskSetupPage'));
const TaskDeploymentsPage = React.lazy(() => import('./pages/sample-tasks/TaskDeploymentsPage'));
```

### 3. Add Routes (inside `<Layout>`)

```tsx
<Route path="sample-tasks" element={<SafeLazy><TaskListPage /></SafeLazy>} />
<Route path="sample-tasks/new" element={<SafeLazy><TaskCreatePage /></SafeLazy>} />
<Route path="sample-tasks/:taskId" element={<SafeLazy><TaskDetailPage /></SafeLazy>} />
<Route path="sample-tasks/:taskId/edit" element={<SafeLazy><TaskEditPage /></SafeLazy>} />
<Route path="sample-tasks/setup" element={<SafeLazy><TaskSetupPage /></SafeLazy>} />
<Route path="sample-tasks/deployments" element={<SafeLazy><TaskDeploymentsPage /></SafeLazy>} />
<Route path="sample-tasks/guide/*" element={<SafeLazy><TaskHubPage /></SafeLazy>} />
```

### 4. Add Vite Proxy (vite.config.ts)

```ts
'/api/sample': {
  target: 'http://localhost:3040',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/sample/, ''),
},
```

### 5. Add API Config (src/config.ts)

```ts
SAMPLE_URL: import.meta.env.VITE_SAMPLE_URL || '/api/sample',
```

### 6. Register Menu Items

```bash
export JWT_TOKEN="your_token"
bash scripts/register-menu.sh
```

## Config Files

| File | Purpose | Register With |
|------|---------|---------------|
| `config/form-schema.json` | FormBuilder form definition | zorbit-pfs-form_builder |
| `config/datatable-page.json` | DataTable page definition | zorbit-pfs-datatable |
| `config/datatable-fields.json` | DataTable field visibility | zorbit-pfs-datatable |

## Pages

| Page | Route | Description |
|------|-------|-------------|
| TaskListPage | /sample-tasks | Standard list with pagination, filters, search |
| TaskCreatePage | /sample-tasks/new | Create form with PII fields |
| TaskEditPage | /sample-tasks/:id/edit | Edit form with status transition |
| TaskDetailPage | /sample-tasks/:id | Read-only detail view |
| TaskHubPage | /sample-tasks/guide/* | Module guide (6-tab hub) |
| TaskSetupPage | /sample-tasks/setup | Seed/flush data management |
| TaskDeploymentsPage | /sample-tasks/deployments | Deployment history |

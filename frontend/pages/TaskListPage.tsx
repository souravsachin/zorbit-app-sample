/**
 * TaskListPage — Task List View
 *
 * This page demonstrates the standard Zorbit list page pattern:
 *   1. Header with title + "Create" action button
 *   2. Filter bar (status, priority, search)
 *   3. DataTable with pagination, sorting, and PII masking
 *
 * DATA FLOW:
 *   This page calls the task service's standard list endpoint directly.
 *   For modules using zorbit-pfs-datatable, you'd use the ZorbitDataTable
 *   component instead, which handles pagination/filtering automatically.
 *
 * TO INTEGRATE INTO ZORBIT-UNIFIED-CONSOLE:
 *   1. Copy this file to src/pages/sample-tasks/TaskListPage.tsx
 *   2. Add the route in App.tsx (see frontend/routes.tsx)
 *   3. Register menu items via navigation service
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import api from '../../services/api';

// API config — update this to match your nginx proxy path
const SAMPLE_API = '/api/sample';

interface Task {
  hashId: string;
  title: string;
  status: string;
  priority: string;
  assigneeNameToken: string | null;
  assigneeHashId: string | null;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
}

interface PaginatedResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const columns: Column<Task>[] = [
  {
    key: 'hashId',
    header: 'Task ID',
    render: (t) => (
      <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
        {t.hashId}
      </code>
    ),
  },
  { key: 'title', header: 'Title' },
  {
    key: 'status',
    header: 'Status',
    render: (t) => <StatusBadge label={t.status} />,
  },
  {
    key: 'priority',
    header: 'Priority',
    render: (t) => <StatusBadge label={t.priority} />,
  },
  {
    key: 'assigneeNameToken',
    header: 'Assignee (PII)',
    render: (t) => (
      <span className="text-xs font-mono text-amber-600">
        {t.assigneeNameToken || 'Unassigned'}
      </span>
    ),
  },
  {
    key: 'tags',
    header: 'Tags',
    render: (t) => (
      <div className="flex flex-wrap gap-1">
        {t.tags?.map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    ),
  },
  {
    key: 'dueDate',
    header: 'Due Date',
    render: (t) =>
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-',
  },
  {
    key: 'createdAt',
    header: 'Created',
    render: (t) => new Date(t.createdAt).toLocaleDateString(),
  },
];

const TaskListPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await api.get<PaginatedResponse>(
        `${SAMPLE_API}/api/v1/O/${orgId}/tasks?${params.toString()}`,
      );
      setTasks(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, page, statusFilter, search]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex items-center space-x-2">
          <button onClick={loadTasks} className="btn-secondary flex items-center space-x-1">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/sample-tasks/new')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-3">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-field w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-48"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <span className="text-sm text-gray-500">{total} tasks</span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tasks}
        loading={loading}
        emptyMessage="No tasks found"
        onRowClick={(task) => navigate(`/sample-tasks/${task.hashId}`)}
      />

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="btn-secondary text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskListPage;

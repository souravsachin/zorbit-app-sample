/**
 * TaskDetailPage — Read-only Task Detail View
 *
 * Shows all task fields in a clean card layout.
 * PII tokens are displayed as-is (amber-colored tokens) unless
 * the API response includes detokenized values.
 *
 * Action buttons: Edit and Delete.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import api from '../../services/api';

const SAMPLE_API = '/api/sample';

const TaskDetailPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`${SAMPLE_API}/api/v1/O/${orgId}/tasks/${taskId}`);
        setTask(res.data);
      } catch {
        toast('Failed to load task', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId, taskId]);

  const handleDelete = async () => {
    if (!confirm(`Delete task ${taskId}? This cannot be undone.`)) return;
    try {
      await api.delete(`${SAMPLE_API}/api/v1/O/${orgId}/tasks/${taskId}`);
      toast('Task deleted', 'success');
      navigate('/sample-tasks');
    } catch {
      toast('Failed to delete task', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading task...</div>;
  }
  if (!task) {
    return <div className="text-center py-12 text-gray-500">Task not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/sample-tasks')} className="btn-secondary p-2">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <code className="text-xs text-gray-500">{task.hashId}</code>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate(`/sample-tasks/${taskId}/edit`)} className="btn-secondary flex items-center space-x-1">
            <Edit size={16} />
            <span>Edit</span>
          </button>
          <button onClick={handleDelete} className="btn-danger flex items-center space-x-1">
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Detail Card */}
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 uppercase">Status</label>
            <div className="mt-1"><StatusBadge label={task.status} /></div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Priority</label>
            <div className="mt-1"><StatusBadge label={task.priority} /></div>
          </div>
        </div>

        {task.description && (
          <div>
            <label className="text-xs text-gray-500 uppercase">Description</label>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 uppercase">Due Date</label>
            <p className="mt-1 text-sm">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Tags</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {task.tags?.length > 0
                ? task.tags.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                      {t}
                    </span>
                  ))
                : <span className="text-sm text-gray-400">None</span>}
            </div>
          </div>
        </div>

        {/* PII Section */}
        <div className="border-t pt-4">
          <h3 className="text-xs text-amber-600 uppercase font-semibold mb-2">
            Assignment (PII-Protected)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Assignee Name Token</label>
              <p className="mt-1 text-sm font-mono text-amber-600">
                {task.assigneeNameToken || 'Unassigned'}
              </p>
              {task.assigneeName && (
                <p className="text-xs text-green-600 mt-0.5">Resolved: {task.assigneeName}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500">Assignee Email Token</label>
              <p className="mt-1 text-sm font-mono text-amber-600">
                {task.assigneeEmailToken || 'N/A'}
              </p>
              {task.assigneeEmail && (
                <p className="text-xs text-green-600 mt-0.5">Resolved: {task.assigneeEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t pt-4 grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>Created: {new Date(task.createdAt).toLocaleString()}</div>
          <div>Updated: {new Date(task.updatedAt).toLocaleString()}</div>
          <div>Created by: {task.createdByHashId}</div>
          <div>Org: {task.organizationHashId}</div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;

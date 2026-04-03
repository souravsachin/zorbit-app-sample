/**
 * TaskEditPage — Edit Existing Task
 *
 * Same form as TaskCreatePage but pre-populated with existing data.
 * Loads the task by hashId from the URL parameter.
 *
 * NOTE: PII fields (assigneeName, assigneeEmail) will show as PII tokens
 * unless the user has the pii:detokenize privilege. The form allows
 * entering new values which will be re-tokenized on save.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import api from '../../services/api';

const SAMPLE_API = '/api/sample';

const TaskEditPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assigneeName: '',
    assigneeEmail: '',
    dueDate: '',
    tags: '',
  });

  useEffect(() => {
    const loadTask = async () => {
      try {
        const res = await api.get(`${SAMPLE_API}/api/v1/O/${orgId}/tasks/${taskId}`);
        const task = res.data;
        setForm({
          title: task.title || '',
          description: task.description || '',
          priority: task.priority || 'medium',
          status: task.status || 'todo',
          assigneeName: task.assigneeName || '', // Only populated if user has pii:detokenize
          assigneeEmail: task.assigneeEmail || '',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          tags: (task.tags || []).join(', '),
        });
      } catch {
        toast('Failed to load task', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadTask();
  }, [orgId, taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: any = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
      };
      if (form.assigneeName) body.assigneeName = form.assigneeName;
      if (form.assigneeEmail) body.assigneeEmail = form.assigneeEmail;

      await api.put(`${SAMPLE_API}/api/v1/O/${orgId}/tasks/${taskId}`, body);
      toast('Task updated', 'success');
      navigate(`/sample-tasks/${taskId}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update task';
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading task...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button onClick={() => navigate(`/sample-tasks/${taskId}`)} className="btn-secondary p-2">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Edit Task {taskId}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input value={form.title} onChange={set('title')} className="input-field" required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={form.description} onChange={set('description')} className="input-field" rows={4} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={form.status} onChange={set('status')} className="input-field">
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select value={form.priority} onChange={set('priority')} className="input-field">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input type="date" value={form.dueDate} onChange={set('dueDate')} className="input-field" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input value={form.tags} onChange={set('tags')} className="input-field" />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-amber-600 mb-3">
            Re-assign (PII-Protected)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Assignee Name</label>
              <input value={form.assigneeName} onChange={set('assigneeName')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assignee Email</label>
              <input type="email" value={form.assigneeEmail} onChange={set('assigneeEmail')} className="input-field" />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={() => navigate(`/sample-tasks/${taskId}`)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex items-center space-x-2">
            <Save size={16} />
            <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskEditPage;

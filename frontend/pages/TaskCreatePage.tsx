/**
 * TaskCreatePage — Create New Task
 *
 * Demonstrates the standard Zorbit form page pattern:
 *   1. Form fields matching the DTO validation rules
 *   2. PII fields clearly marked (assigneeName, assigneeEmail)
 *   3. Submit calls the POST endpoint with the JWT token
 *   4. On success, navigate back to the list page
 *
 * ALTERNATIVE: For config-driven forms using zorbit-pfs-form_builder,
 * see the form-schema.json in frontend/config/ and use the FormRenderer
 * component from zorbit-sdk-react.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import api from '../../services/api';

const SAMPLE_API = '/api/sample';

const TaskCreatePage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigneeName: '',
    assigneeEmail: '',
    dueDate: '',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: any = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : undefined,
      };

      // PII fields — these will be tokenized by the backend via PII Vault
      if (form.assigneeName) body.assigneeName = form.assigneeName;
      if (form.assigneeEmail) body.assigneeEmail = form.assigneeEmail;

      await api.post(`${SAMPLE_API}/api/v1/O/${orgId}/tasks`, body);
      toast('Task created successfully', 'success');
      navigate('/sample-tasks');
    } catch {
      toast('Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button onClick={() => navigate('/sample-tasks')} className="btn-secondary p-2">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Create Task</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Task Details */}
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input value={form.title} onChange={set('title')} className="input-field" required maxLength={200} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={form.description} onChange={set('description')} className="input-field" rows={4} />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <input value={form.tags} onChange={set('tags')} className="input-field" placeholder="finance, quarterly, urgent" />
        </div>

        {/* PII Section */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-amber-600 mb-3">
            Assignment (PII-Protected)
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Name and email are tokenized via the PII Vault. Raw values never touch the task database.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Assignee Name</label>
              <input value={form.assigneeName} onChange={set('assigneeName')} className="input-field" placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assignee Email</label>
              <input type="email" value={form.assigneeEmail} onChange={set('assigneeEmail')} className="input-field" placeholder="jane@company.com" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={() => navigate('/sample-tasks')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex items-center space-x-2">
            <Save size={16} />
            <span>{submitting ? 'Creating...' : 'Create Task'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreatePage;

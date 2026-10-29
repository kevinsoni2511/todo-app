import React, { useState, useEffect } from 'react';

/**
 * TodoForm Component
 * Handles creating new tasks and editing existing tasks.
 * Uses controlled inputs and validates fields before submitting.
 */
export default function TodoForm({ onSubmit, editingTodo, onCancelEdit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  // If editingTodo changes (user clicks Edit on a task), populate the form
  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title || '');
      setDescription(editingTodo.description || '');
      setPriority(editingTodo.priority || 'medium');
      setDueDate(editingTodo.due_date || '');
      setError('');
    } else {
      resetForm();
    }
  }, [editingTodo]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a task title.');
      return;
    }

    if (trimmedTitle.length > 255) {
      setError('Task title must be under 255 characters.');
      return;
    }

    // Call parent handler
    onSubmit({
      id: editingTodo ? editingTodo.id : undefined,
      title: trimmedTitle,
      description: description.trim(),
      priority,
      due_date: dueDate || null
    });

    if (!editingTodo) {
      resetForm();
    }
  };

  return (
    <div className={`todo-form-container ${editingTodo ? 'is-editing' : ''}`}>
      <div className="form-header">
        <h2 className="form-title">
          {editingTodo ? '✏️ Edit Task' : '✨ Add New Task'}
        </h2>
        {editingTodo && (
          <button type="button" onClick={onCancelEdit} className="btn-cancel-edit">
            Cancel
          </button>
        )}
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="todo-form">
        <div className="form-group">
          <label htmlFor="todo-title" className="form-label">
            Task Title <span className="required">*</span>
          </label>
          <input
            id="todo-title"
            type="text"
            placeholder="What needs to be done? (e.g., Review API endpoints)"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            className="input-title"
            maxLength={255}
          />
        </div>

        <div className="form-group">
          <label htmlFor="todo-description" className="form-label">
            Description <span className="optional">(optional)</span>
          </label>
          <textarea
            id="todo-description"
            rows="2"
            placeholder="Add extra notes or subtasks..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-description"
          />
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="todo-priority" className="form-label">
              Priority
            </label>
            <select
              id="todo-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="select-priority"
            >
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🔴 High Priority</option>
            </select>
          </div>

          <div className="form-group flex-1">
            <label htmlFor="todo-due-date" className="form-label">
              Due Date
            </label>
            <input
              id="todo-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-date"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">
            {editingTodo ? '💾 Save Changes' : '➕ Add Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

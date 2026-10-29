import React from 'react';

/**
 * TodoItem Component
 * Represents an individual task card with checkbox, badges, and action buttons.
 */
export default function TodoItem({ todo, onToggle, onEdit, onDelete }) {
  const isCompleted = Boolean(Number(todo.is_completed));

  // Determine if task is overdue
  const isOverdue = (() => {
    if (!todo.due_date || isCompleted) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(todo.due_date);
    return dueDate < today;
  })();

  // Format Due Date for clean readability
  const formattedDueDate = todo.due_date
    ? new Date(todo.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <div className={`todo-item-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      {/* Left Checkbox */}
      <div className="todo-item-check">
        <button
          type="button"
          onClick={() => onToggle(todo.id)}
          className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted && '✓'}
        </button>
      </div>

      {/* Main Content */}
      <div className="todo-item-body">
        <div className="todo-item-header">
          <h3 className="todo-item-title">{todo.title}</h3>

          <div className="todo-badges">
            {/* Priority Badge */}
            <span className={`badge priority-${todo.priority}`}>
              {todo.priority === 'high' && '🔴 High'}
              {todo.priority === 'medium' && '🟡 Medium'}
              {todo.priority === 'low' && '🟢 Low'}
            </span>

            {/* Due Date & Overdue Badge */}
            {formattedDueDate && (
              <span className={`badge due-date-badge ${isOverdue ? 'overdue-badge' : ''}`}>
                {isOverdue ? '⚠️ Overdue: ' : '📅 '}
                {formattedDueDate}
              </span>
            )}
          </div>
        </div>

        {/* Optional Description */}
        {todo.description && (
          <p className="todo-item-description">{todo.description}</p>
        )}
      </div>

      {/* Right Action Buttons */}
      <div className="todo-item-actions">
        <button
          type="button"
          onClick={() => onEdit(todo)}
          className="btn-action btn-edit"
          title="Edit task"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={() => onDelete(todo.id, todo.title)}
          className="btn-action btn-delete"
          title="Delete task"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

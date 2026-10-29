import React from 'react';
import TodoItem from './TodoItem';

/**
 * TodoList Component
 * Renders the collection of tasks, a loading state, or an empty-state illustration.
 */
export default function TodoList({
  todos,
  loading,
  onToggle,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange
}) {
  if (loading) {
    return (
      <div className="empty-state-card">
        <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
        <h3 className="empty-state-title">Loading your tasks...</h3>
        <p className="empty-state-desc">Fetching latest records from MySQL database.</p>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon">🎯</div>
        <h3 className="empty-state-title">No tasks found</h3>
        <p className="empty-state-desc">
          You have no tasks here yet! Add your first task above to start tracking your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="todo-list-wrapper">
      <div className="todo-items-grid">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="pagination-btn"
          >
            ← Previous
          </button>

          <span className="pagination-info">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

import React from 'react';

/**
 * TodoFilters Component
 * Provides search bar, status tabs, priority filter, sorting, and clear completed button.
 */
export default function TodoFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  onSortChange,
  completedCount,
  onClearCompleted
}) {
  const statusTabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
    { id: 'overdue', label: 'Overdue' }
  ];

  return (
    <div className="filters-container">
      {/* Search Bar */}
      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search tasks by title or notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-search"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="btn-clear-search"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Clear Completed Button */}
        {completedCount > 0 && (
          <button
            onClick={onClearCompleted}
            className="btn-clear-completed"
            title="Remove all completed tasks"
          >
            🗑 Clear Completed ({completedCount})
          </button>
        )}
      </div>

      {/* Filter and Sort Controls */}
      <div className="filters-controls-row">
        {/* Status Filter Tabs */}
        <div className="status-tabs">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`status-tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority & Sorting Dropdowns */}
        <div className="dropdowns-group">
          <div className="filter-dropdown">
            <span className="dropdown-label">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="select-filter"
            >
              <option value="all">All Priorities</option>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>

          <div className="filter-dropdown">
            <span className="dropdown-label">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="select-filter"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TodoStats from './components/TodoStats';
import TodoForm from './components/TodoForm';
import TodoFilters from './components/TodoFilters';
import TodoList from './components/TodoList';
import Login from './components/Login';
import Register from './components/Register';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import useAuth from './hooks/useAuth';
import api from './services/api';
import './App.css';

export default function App() {
  // Authentication Hook (reads active PHP session)
  const { user, loading: authLoading, login, register, loginWithGoogle, logout } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  // Live Database Todos State
  const [todos, setTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [todoError, setTodoError] = useState(null);

  // Server-Computed Statistics State
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });

  // Server-Side Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed' | 'overdue'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'due_date' | 'priority'

  // Server-Side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  // In-App Toast Notifications
  const [toasts, setToasts] = useState([]);

  // In-App Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmVariant: 'danger',
    onConfirm: null
  });

  // API Status state (checks connection to PHP backend)
  const [apiStatus, setApiStatus] = useState({ connected: false, message: 'Connecting to PHP API...' });

  // State for Editing Task
  const [editingTodo, setEditingTodo] = useState(null);

  // --------------------------------------------------------------------------
  // Toast Helper
  // --------------------------------------------------------------------------
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  // --------------------------------------------------------------------------
  // Check Backend API Health on Mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    async function checkApiHealth() {
      try {
        const response = await api.get('/api/test.php');
        setApiStatus({ connected: true, message: response.message });
      } catch (err) {
        setApiStatus({ connected: false, message: err.message });
      }
    }

    checkApiHealth();
  }, []);

  // --------------------------------------------------------------------------
  // Fetch Server-Side Filtered, Sorted & Paginated Todos from MySQL
  // --------------------------------------------------------------------------
  const fetchTodos = useCallback(async () => {
    if (!user) return;
    try {
      setTodosLoading(true);
      setTodoError(null);

      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        priority: priorityFilter,
        sort_by: sortBy,
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      const res = await api.get(`/api/todos/list.php?${params.toString()}`);

      if (res.success && res.data) {
        setTodos(res.data.todos || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.total_pages || 1);
        }
      }
    } catch (err) {
      console.error('Error fetching tasks from MySQL:', err);
      setTodoError(err.message || 'Failed to load tasks from server.');
      showToast(err.message || 'Failed to load tasks', 'error');
    } finally {
      setTodosLoading(false);
    }
  }, [user, searchQuery, statusFilter, priorityFilter, sortBy, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Quick Test POST API handler
  const handleTestApi = async () => {
    try {
      const response = await api.post('/api/test.php', {
        source: 'React Frontend (Vite)',
        action: 'Test API Button Click',
        message: 'Namaste from React! Live API communication active.'
      });
      showToast(`API Connected: ${response.message}`, 'info');
    } catch (err) {
      showToast(`API Error: ${err.message}`, 'error');
    }
  };

  // --------------------------------------------------------------------------
  // CRUD Handlers with In-App Modals and Toasts
  // --------------------------------------------------------------------------

  // Create or Update Task in MySQL
  const handleSaveTodo = async (formData) => {
    try {
      setTodoError(null);

      if (formData.id) {
        // Update Task (POST /api/todos/update.php)
        const res = await api.post('/api/todos/update.php', formData);
        if (res.success) {
          setEditingTodo(null);
          showToast('Task updated successfully! 💾', 'success');
          fetchTodos();
        }
      } else {
        // Create New Task (POST /api/todos/create.php)
        const res = await api.post('/api/todos/create.php', formData);
        if (res.success) {
          showToast('Task added successfully! 🚀', 'success');
          fetchTodos();
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to save task.', 'error');
    }
  };

  // Toggle Completion in MySQL (POST /api/todos/toggle.php)
  const handleToggleTodo = async (id) => {
    try {
      const res = await api.post('/api/todos/toggle.php', { id });
      if (res.success) {
        const isDone = Boolean(Number(res.data.is_completed));
        showToast(isDone ? 'Task marked as completed! 🎉' : 'Task marked as pending.', 'info');
        fetchTodos();
      }
    } catch (err) {
      showToast(`Toggle failed: ${err.message}`, 'error');
    }
  };

  // Delete Task in MySQL (Trigger Custom Modal)
  const handleDeleteTodo = (id, title) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Task?',
      message: `Are you sure you want to delete "${title}"? This task will be permanently removed from MySQL.`,
      confirmText: 'Delete Task',
      confirmVariant: 'danger',
      onConfirm: async () => {
        closeConfirmModal();
        try {
          const res = await api.post('/api/todos/delete.php', { id });
          if (res.success) {
            if (editingTodo && editingTodo.id === id) {
              setEditingTodo(null);
            }
            showToast('Task deleted successfully.', 'info');
            fetchTodos();
          }
        } catch (err) {
          showToast(`Delete failed: ${err.message}`, 'error');
        }
      }
    });
  };

  // Clear Completed Tasks in MySQL (Trigger Custom Modal)
  const handleClearCompleted = () => {
    if (stats.completed === 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'Clear Completed Tasks?',
      message: `Are you sure you want to delete all ${stats.completed} completed task(s)? This cannot be undone.`,
      confirmText: 'Clear All Completed',
      confirmVariant: 'danger',
      onConfirm: async () => {
        closeConfirmModal();
        try {
          const res = await api.post('/api/todos/clear_completed.php', {});
          if (res.success) {
            showToast(`Cleared ${res.data.deleted_count} completed task(s).`, 'success');
            fetchTodos();
          }
        } catch (err) {
          showToast(`Failed to clear: ${err.message}`, 'error');
        }
      }
    });
  };

  // Pre-fill form for editing
  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    showToast(`Editing "${todo.title}"`, 'info');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
  };

  // --------------------------------------------------------------------------
  // Conditional Render: Loading state while checking PHP session
  // --------------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="app-loading-screen">
        <div className="spinner"></div>
        <p>Checking active session with PHP backend...</p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Conditional Render: Unauthenticated user (Show Login / Register)
  // --------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="app-container">
        <Toast toasts={toasts} onDismiss={dismissToast} />
        <Header
          user={null}
          apiStatus={apiStatus}
          onTestApi={handleTestApi}
        />

        {authView === 'login' ? (
          <Login
            onLogin={async (email, pwd) => {
              const res = await login(email, pwd);
              if (res.success) showToast('Welcome back! Signed in successfully.', 'success');
              return res;
            }}
            onGoogleLogin={async (credential, profileData) => {
              const res = await loginWithGoogle(credential, profileData);
              if (res.success) showToast(`Welcome, ${res.user?.name || 'User'}! Signed in with Google.`, 'success');
              return res;
            }}
            onSwitchToRegister={() => setAuthView('register')}
          />
        ) : (
          <Register
            onRegister={async (name, email, pwd, confirmPwd) => {
              const res = await register(name, email, pwd, confirmPwd);
              if (res.success) showToast('Account created! Welcome to TaskMaster.', 'success');
              return res;
            }}
            onGoogleLogin={async (credential, profileData) => {
              const res = await loginWithGoogle(credential, profileData);
              if (res.success) showToast(`Welcome, ${res.user?.name || 'User'}! Connected with Google.`, 'success');
              return res;
            }}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Floating Toast Notification System */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Accessible Confirmation Modal Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />

      {/* Header with Live User Profile and API Status */}
      <Header
        user={user}
        onLogout={async () => {
          await logout();
          showToast('Logged out successfully.', 'info');
        }}
        apiStatus={apiStatus}
        onTestApi={handleTestApi}
      />

      {/* Dashboard Statistics (Database Aggregates) */}
      <TodoStats stats={stats} />

      {/* Server Error Alert if any */}
      {todoError && (
        <div className="form-error-banner" style={{ marginBottom: '20px' }}>
          ⚠️ {todoError}
        </div>
      )}

      {/* Add / Edit Task Form */}
      <TodoForm
        onSubmit={handleSaveTodo}
        editingTodo={editingTodo}
        onCancelEdit={handleCancelEdit}
      />

      {/* Search, Filter Tabs & Sort Controls */}
      <TodoFilters
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(status) => {
          setStatusFilter(status);
          setCurrentPage(1);
        }}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={(priority) => {
          setPriorityFilter(priority);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortChange={(sort) => {
          setSortBy(sort);
          setCurrentPage(1);
        }}
        completedCount={stats.completed}
        onClearCompleted={handleClearCompleted}
      />

      {/* Tasks List with Server Pagination */}
      <TodoList
        todos={todos}
        loading={todosLoading}
        onToggle={handleToggleTodo}
        onEdit={handleEditTodo}
        onDelete={handleDeleteTodo}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

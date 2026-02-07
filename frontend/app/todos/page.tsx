"use client";

/**
 * Authenticated Todo UI page.
 * TASK-049: Add search bar to TodoList page
 * Updated for Phase V with search, priority, tags, due dates
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Todo, Priority, listTodos, createTodo as createTodoApi, deleteTodo as deleteTodoApi, updateTodo as updateTodoApi, completeTodo as completeTodoApi } from "@/lib/todos-api";
import TaskSearch from "@/components/TaskSearch";
import TaskPriority from "@/components/TaskPriority";
import TaskTags from "@/components/TaskTags";
import DueDatePicker from "@/components/DueDatePicker";
import Chat from "@/components/Chat";

export default function TodosPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchResults, setSearchResults] = useState<Todo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listTodos();
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTodos();
    }
  }, [session, fetchTodos]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const interval = setInterval(fetchTodos, 3000);
    return () => clearInterval(interval);
  }, [session, fetchTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTodoApi({ title, description, priority });
      setTitle("");
      setDescription("");
      setPriority("medium");
      fetchTodos();
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  };

  const handleCompleteTodo = async (id: number) => {
    try {
      await completeTodoApi(id);
      fetchTodos();
    } catch (error) {
      console.error("Failed to complete todo:", error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTodoApi(id);
      fetchTodos();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleUpdateTodo = async (id: number) => {
    try {
      await updateTodoApi(id, { title: editTitle, description: editDescription });
      setEditingId(null);
      fetchTodos();
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleSearchResults = (results: Todo[] | null) => {
    setSearchResults(results);
  };

  const handleClearSearch = () => {
    setSearchResults(null);
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const displayTodos = Array.isArray(searchResults) ? searchResults : (Array.isArray(todos) ? todos : []);
  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = todos.length - completedCount;

  if (isPending || !session) {
    return (
      <div className="loading-page">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-app">
      {/* Header */}
      <div className="todo-header">
        <div className="todo-header-left">
          <h1>My Tasks</h1>
          <p>Welcome back, {session.user?.name || session.user?.email}</p>
        </div>
        <div className="todo-header-right">
          <div className="header-stats">
            <span className="stat-badge">{pendingCount} active</span>
            <span className="stat-badge">{completedCount} done</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">Sign Out</button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginTop: '12px', marginBottom: '4px' }}>
        <TaskSearch onResults={handleSearchResults} onClear={handleClearSearch} />
      </div>

      {/* Create Form */}
      <form onSubmit={handleCreateTodo} className="create-form">
        <div className="create-form-row">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
            className="form-input"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="create-form-select"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)"
          rows={2}
          className="create-form-textarea"
        />
        <button type="submit" className="btn-add">
          Add Task
        </button>
      </form>

      {/* Search Results Indicator */}
      {searchResults !== null && (
        <div className="search-indicator">
          Showing {searchResults.length} search result{searchResults.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Todo List */}
      {loading && todos.length === 0 ? (
        <div className="loading-page" style={{ minHeight: '200px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <span>Loading tasks...</span>
          </div>
        </div>
      ) : (
        <div>
          {displayTodos.length === 0 ? (
            <div className="todo-empty">
              <div className="todo-empty-icon">
                {searchResults !== null ? '\u{1F50D}' : '\u{1F4CB}'}
              </div>
              <p>{searchResults !== null ? "No matching tasks found." : "No tasks yet. Create your first one above!"}</p>
            </div>
          ) : (
            <ul className="todo-list">
              {displayTodos.map((todo) => (
                <li
                  key={todo.id}
                  className={`todo-card priority-${todo.priority || 'medium'} ${todo.completed ? 'completed' : ''}`}
                >
                  {editingId === todo.id ? (
                    <div>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="todo-edit-input"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="todo-edit-textarea"
                      />
                      <div className="todo-edit-actions">
                        <button onClick={() => handleUpdateTodo(todo.id)} className="btn-save">
                          Save
                        </button>
                        <button onClick={cancelEdit} className="btn-cancel">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="todo-card-main">
                        <div className="todo-card-content">
                          <h3 className="todo-card-title">
                            {todo.completed && '\u2713 '}{todo.title}
                          </h3>
                          {todo.description && (
                            <p className="todo-card-desc">{todo.description}</p>
                          )}
                        </div>
                        <div className="todo-card-actions">
                          {!todo.completed && (
                            <>
                              <button
                                onClick={() => startEdit(todo)}
                                className="btn-icon btn-icon-edit"
                                title="Edit"
                              >
                                &#9998;
                              </button>
                              <button
                                onClick={() => handleCompleteTodo(todo.id)}
                                className="btn-icon btn-icon-complete"
                                title="Complete"
                              >
                                &#10003;
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="btn-icon btn-icon-delete"
                            title="Delete"
                          >
                            &#10005;
                          </button>
                        </div>
                      </div>

                      {/* Phase V metadata */}
                      <div className="todo-meta">
                        <TaskPriority
                          taskId={todo.id}
                          priority={todo.priority || "medium"}
                          disabled={todo.completed}
                        />
                        <DueDatePicker
                          taskId={todo.id}
                          dueDate={todo.due_date}
                          disabled={todo.completed}
                        />
                        <TaskTags
                          taskId={todo.id}
                          tags={todo.tags || []}
                          disabled={todo.completed}
                        />
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Chat FAB */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={`chat-fab ${chatOpen ? 'chat-fab-close' : 'chat-fab-open'}`}
        title={chatOpen ? 'Close chat' : 'AI Todo Assistant'}
      >
        {chatOpen ? '\u00D7' : '\u{1F4AC}'}
      </button>

      {/* Inline Chat Panel */}
      {chatOpen && (
        <div className="chat-panel">
          <Chat />
        </div>
      )}
    </div>
  );
}

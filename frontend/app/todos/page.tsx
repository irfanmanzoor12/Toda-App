"use client";

/**
 * Authenticated Todo UI page.
 * TASK-049: Add search bar to TodoList page
 * Updated for Phase V with search, priority, tags, due dates
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Todo, Priority, listTodos, createTodo as createTodoApi, deleteTodo as deleteTodoApi, updateTodo as updateTodoApi, completeTodo as completeTodoApi } from "@/lib/todos-api";
import TaskSearch from "@/components/TaskSearch";
import TaskPriority from "@/components/TaskPriority";
import TaskTags from "@/components/TaskTags";
import DueDatePicker from "@/components/DueDatePicker";

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
    const interval = setInterval(fetchTodos, 15000);
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

  // Ensure displayTodos is always an array
  const displayTodos = Array.isArray(searchResults) ? searchResults : (Array.isArray(todos) ? todos : []);

  if (isPending || !session) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <div style={{
      padding: "20px",
      maxWidth: "900px",
      margin: "0 auto",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <h1 style={{ marginBottom: "24px", fontSize: "28px" }}>My Todos</h1>

      {/* Search Component */}
      <TaskSearch onResults={handleSearchResults} onClear={handleClearSearch} />

      {/* Create Form */}
      <form onSubmit={handleCreateTodo} style={{
        marginBottom: "32px",
        padding: "20px",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
            style={{
              flex: 1,
              padding: "10px 12px",
              fontSize: "16px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
            }}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            style={{
              padding: "10px 12px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
            }}
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
          placeholder="Description (optional)"
          rows={2}
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: "12px",
            fontSize: "14px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            resize: "vertical",
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
        />
        <button type="submit" style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}>
          Add Todo
        </button>
      </form>

      {/* Search Results Indicator */}
      {searchResults !== null && (
        <div style={{
          padding: "10px 16px",
          marginBottom: "16px",
          backgroundColor: "#e0f2fe",
          borderRadius: "6px",
          fontSize: "14px",
          color: "#0369a1"
        }}>
          Showing {searchResults.length} search result{searchResults.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Todo List */}
      {loading ? (
        <div>Loading todos...</div>
      ) : (
        <div>
          {displayTodos.length === 0 ? (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "40px" }}>
              {searchResults !== null ? "No matching tasks found." : "No todos yet. Create one above!"}
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {displayTodos.map((todo) => (
                <li
                  key={todo.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "16px",
                    marginBottom: "12px",
                    backgroundColor: todo.completed ? "#f9fafb" : "white",
                    borderRadius: "8px",
                    borderLeft: `4px solid ${
                      todo.priority === "critical" ? "#7b1fa2" :
                      todo.priority === "high" ? "#c62828" :
                      todo.priority === "medium" ? "#ef6c00" : "#43a047"
                    }`,
                  }}
                >
                  {editingId === todo.id ? (
                    <div>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          marginBottom: "10px",
                          fontSize: "16px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          boxSizing: "border-box"
                        }}
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          marginBottom: "12px",
                          fontSize: "14px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          resize: "vertical",
                          fontFamily: "inherit",
                          boxSizing: "border-box"
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleUpdateTodo(todo.id)} style={{
                          padding: "6px 12px",
                          fontSize: "14px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}>
                          Save
                        </button>
                        <button onClick={cancelEdit} style={{
                          padding: "6px 12px",
                          fontSize: "14px",
                          backgroundColor: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            margin: "0 0 4px 0",
                            fontSize: "16px",
                            color: todo.completed ? "#6b7280" : "#111827",
                            textDecoration: todo.completed ? "line-through" : "none"
                          }}>
                            {todo.completed && "✓ "}{todo.title}
                          </h3>
                          {todo.description && (
                            <p style={{ margin: "0 0 8px 0", color: "#6b7280", fontSize: "14px" }}>
                              {todo.description}
                            </p>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {!todo.completed && (
                            <>
                              <button onClick={() => startEdit(todo)} style={{
                                padding: "4px 10px",
                                fontSize: "12px",
                                backgroundColor: "#f3f4f6",
                                color: "#374151",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}>
                                Edit
                              </button>
                              <button onClick={() => handleCompleteTodo(todo.id)} style={{
                                padding: "4px 10px",
                                fontSize: "12px",
                                backgroundColor: "#10b981",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}>
                                ✓
                              </button>
                            </>
                          )}
                          <button onClick={() => handleDeleteTodo(todo.id)} style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}>
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Phase V metadata */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid #f0f0f0"
                      }}>
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
    </div>
  );
}

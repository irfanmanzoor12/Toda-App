"use client";

/**
 * Authenticated Todo UI page.
 *
 * Task: T211 - Implement authenticated Todo UI with CRUD + complete.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { apiCall } from "@/lib/api";

interface Todo {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export default function TodosPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Gate access with Better Auth session
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  // Fetch todos
  useEffect(() => {
    if (session?.user?.id) {
      fetchTodos();
    }
  }, [session]);

  // Auto-refresh polling (every 5 seconds)
  useEffect(() => {
    if (!session?.user?.id) return;

    const interval = setInterval(() => {
      fetchTodos();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [session]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const userId = session?.user?.id;
      const data = await apiCall<Todo[]>(`/api/${userId}/tasks`);
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = session?.user?.id;
      await apiCall(`/api/${userId}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title, description, completed: false }),
      });
      setTitle("");
      setDescription("");
      fetchTodos();
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  };

  const completeTodo = async (id: number) => {
    try {
      const userId = session?.user?.id;
      await apiCall(`/api/${userId}/tasks/${id}/complete`, {
        method: "PATCH",
      });
      fetchTodos();
    } catch (error) {
      console.error("Failed to complete todo:", error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const userId = session?.user?.id;
      await apiCall(`/api/${userId}/tasks/${id}`, {
        method: "DELETE",
      });
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

  const updateTodo = async (id: number) => {
    try {
      const userId = session?.user?.id;
      await apiCall(`/api/${userId}/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          completed: todos.find(t => t.id === id)?.completed || false,
        }),
      });
      setEditingId(null);
      fetchTodos();
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  if (isPending || !session) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      padding: "20px",
      maxWidth: "800px",
      margin: "0 auto",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <h1 style={{ marginBottom: "24px", fontSize: "28px" }}>My Todos</h1>

      <form onSubmit={createTodo} style={{
        marginBottom: "32px",
        padding: "20px",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e5e7eb"
      }}>
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: "12px",
              fontSize: "16px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              boxSizing: "border-box"
            }}
          />
        </div>
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: "12px",
              fontSize: "16px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              resize: "vertical",
              fontFamily: "inherit",
              boxSizing: "border-box"
            }}
          />
        </div>
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

      {loading ? (
        <div>Loading todos...</div>
      ) : (
        <div>
          {todos.length === 0 ? (
            <p>No todos yet. Create one above!</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "16px",
                    marginBottom: "12px",
                    backgroundColor: todo.completed ? "#f3f4f6" : "white",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
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
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          marginBottom: "12px",
                          fontSize: "16px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          resize: "vertical",
                          fontFamily: "inherit",
                          boxSizing: "border-box"
                        }}
                      />
                      <button
                        onClick={() => updateTodo(todo.id)}
                        style={{
                          marginRight: "8px",
                          padding: "6px 12px",
                          fontSize: "14px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: "6px 12px",
                          fontSize: "14px",
                          backgroundColor: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{
                        margin: "0 0 8px 0",
                        fontSize: "18px",
                        color: todo.completed ? "#6b7280" : "#111827",
                        textDecoration: todo.completed ? "line-through" : "none"
                      }}>
                        {todo.completed ? "✓ " : ""}
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p style={{
                          margin: "0 0 12px 0",
                          color: "#6b7280",
                          fontSize: "14px",
                          lineHeight: "1.5"
                        }}>
                          {todo.description}
                        </p>
                      )}
                      <div style={{
                        marginTop: "12px",
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap"
                      }}>
                        <button
                          onClick={() => startEdit(todo)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "14px",
                            backgroundColor: "#f3f4f6",
                            color: "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Edit
                        </button>
                        {!todo.completed && (
                          <button
                            onClick={() => completeTodo(todo.id)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "14px",
                              backgroundColor: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer"
                            }}
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "14px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Delete
                        </button>
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

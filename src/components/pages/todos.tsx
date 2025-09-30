'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Pencil, Check, X, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"

interface Todo {
  _id: string;
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  tags?: string[];
  createdAt: Date;
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Todo>>({});
  const [newTodoText, setNewTodoText] = useState('');
  const [addingTodo, setAddingTodo] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/todos');
      
      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTodos(data.data.todos || []);
      } else {
        throw new Error(data.error || 'Failed to load todos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return;

    try {
      setAddingTodo(true);
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newTodoText.trim(),
          completed: false,
        }),
      });

      if (response.ok) {
        setNewTodoText('');
        await fetchTodos();
        toast.success('✅ Todo added successfully!', {
          description: newTodoText.trim(),
        });
      } else {
        toast.error('Failed to add todo');
      }
    } catch (err) {
      console.error('Failed to add todo:', err);
      toast.error('Failed to add todo');
    } finally {
      setAddingTodo(false);
    }
  };

  const handleToggleComplete = async (todoId: string, currentCompleted: boolean) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          todoId,
          updates: {
            completed: !currentCompleted,
            ...(!!!currentCompleted ? { completedAt: new Date() } : {}),
          },
        }),
      });

      if (response.ok) {
        await fetchTodos();
        toast.success(!currentCompleted ? '✅ Todo marked as complete!' : '⏳ Todo marked as incomplete', {
          duration: 2000,
        });
      } else {
        toast.error('Failed to update todo');
      }
    } catch (err) {
      console.error('Failed to toggle todo:', err);
      toast.error('Failed to update todo');
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditForm({
      text: todo.text,
      description: todo.description,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (todoId: string) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          todoId,
          updates: editForm,
        }),
      });

      if (response.ok) {
        await fetchTodos();
        setEditingId(null);
        setEditForm({});
        toast.success('📝 Todo updated successfully!');
      } else {
        toast.error('Failed to update todo');
      }
    } catch (err) {
      console.error('Failed to update todo:', err);
      toast.error('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
      const response = await fetch(`/api/todos?todoId=${todoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTodos();
        toast.success('🗑️ Todo deleted successfully!');
      } else {
        toast.error('Failed to delete todo');
      }
    } catch (err) {
      console.error('Failed to delete todo:', err);
      toast.error('Failed to delete todo');
    }
  };

  const getPriorityBadge = (priority?: string) => {
    const colors: Record<string, 'destructive' | 'default' | 'secondary'> = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };
    const variant = colors[priority || 'low'] || 'secondary';
    
    return (
      <Badge variant={variant}>
        {(priority || 'low').charAt(0).toUpperCase() + (priority || 'low').slice(1)}
      </Badge>
    );
  };

  const formatDueDate = (date?: Date) => {
    if (!date) return null;
    
    const dueDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, urgent: true };
    } else if (diffDays === 0) {
      return { text: 'Due today', urgent: true };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', urgent: true };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, urgent: false };
    }
    
    return { text: dueDate.toLocaleDateString(), urgent: false };
  };

  const pendingCount = todos.filter(t => !t.completed).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Todos</h2>
          <p className="text-muted-foreground">Manage your personal tasks and todo items</p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Todos</h2>
          <p className="text-muted-foreground">Manage your personal tasks and todo items</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-destructive">{error}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={fetchTodos} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Todos</h2>
        <p className="text-muted-foreground">Manage your personal tasks and todo items</p>
      </div>

      {/* Add New Todo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Todo</CardTitle>
          <CardDescription>Quickly add a new task to your list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="What needs to be done?"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddTodo();
                }
              }}
              disabled={addingTodo}
              className="flex-1"
            />
            <Button onClick={handleAddTodo} disabled={!newTodoText.trim() || addingTodo}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Todos List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Your Todos</CardTitle>
            <Badge variant="secondary">{pendingCount} Pending</Badge>
          </div>
          <CardDescription>
            {todos.length === 0 ? 'No todos yet' : `${todos.length} total tasks`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No todos yet. Add one above to get started!</p>
              </div>
            ) : (
              todos.map((todo) => (
                <div key={todo._id}>
                  {editingId === todo.id ? (
                    <div className="p-4 border-2 border-primary rounded-lg space-y-4 bg-accent/10">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Task</label>
                        <Input
                          value={editForm.text || ''}
                          onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                          placeholder="Todo text"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Add more details..."
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Priority</label>
                          <Select
                            value={editForm.priority || 'low'}
                            onValueChange={(value) => setEditForm({ ...editForm, priority: value as 'low' | 'medium' | 'high' })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Due Date</label>
                          <Input
                            type="date"
                            value={editForm.dueDate ? new Date(editForm.dueDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value ? new Date(e.target.value) : undefined })}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={cancelEditing}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => saveEdit(todo.id)}>
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`group flex items-start gap-3 p-4 border rounded-lg hover:border-primary/50 hover:bg-accent/5 transition-all ${
                      todo.completed ? 'opacity-60' : ''
                    }`}>
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggleComplete(todo.id, todo.completed)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-1">
                        <p className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {todo.text}
                        </p>
                        {todo.description && (
                          <p className="text-sm text-muted-foreground">{todo.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {todo.priority && getPriorityBadge(todo.priority)}
                          {todo.category && (
                            <Badge variant="outline">{todo.category}</Badge>
                          )}
                          {todo.dueDate && (() => {
                            const dueDateInfo = formatDueDate(todo.dueDate);
                            return dueDateInfo ? (
                              <Badge variant={dueDateInfo.urgent ? 'destructive' : 'outline'}>
                                {dueDateInfo.text}
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(todo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

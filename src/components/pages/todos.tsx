'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2 } from "lucide-react"

interface Todo {
  _id: string;
  title: string;
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
  const [newTodoTitle, setNewTodoTitle] = useState('');
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
    if (!newTodoTitle.trim()) return;

    try {
      setAddingTodo(true);
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTodoTitle.trim(),
          completed: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add todo');
      }

      const data = await response.json();
      
      if (data.success) {
        setNewTodoTitle('');
        await fetchTodos();
      } else {
        throw new Error(data.error || 'Failed to add todo');
      }
    } catch (err) {
      console.error('Error adding todo:', err);
    } finally {
      setAddingTodo(false);
    }
  };

  const handleToggleComplete = async (todoId: string, currentCompleted: boolean) => {
    try {
      const updates: { completed: boolean; completedAt?: Date | null } = { 
        completed: !currentCompleted 
      };
      
      if (!currentCompleted) {
        updates.completedAt = new Date();
      } else {
        updates.completedAt = null;
      }

      const response = await fetch('/api/todos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          todoId,
          updates,
        }),
      });

      if (response.ok) {
        await fetchTodos();
      }
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ todoId }),
      });

      if (response.ok) {
        await fetchTodos();
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  const getPriorityBadge = (priority?: string) => {
    const colors: Record<string, string> = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };
    return colors[priority || 'low'] || 'secondary';
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
      return { text: `Overdue by ${Math.abs(diffDays)} days`, urgent: true };
    } else if (diffDays === 0) {
      return { text: 'Due today', urgent: true };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', urgent: false };
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
          <h2 className="text-3xl font-bold tracking-tight">To-dos</h2>
          <p className="text-muted-foreground">
            Simple checklist-style task management for your daily tasks.
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">To-dos</h2>
          <p className="text-muted-foreground">
            Simple checklist-style task management for your daily tasks.
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">To-dos</h2>
        <p className="text-muted-foreground">
          Simple checklist-style task management for your daily tasks.
        </p>
      </div>
      
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Todo List</CardTitle>
              <Badge variant="secondary">{pendingCount} Pending</Badge>
            </div>
            <CardDescription>
              Keep track of your daily tasks and check them off as you complete them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add new todo form */}
              <div className="flex items-center gap-4">
                <Input 
                  placeholder="Add a new todo..." 
                  className="flex-1"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTodo();
                    }
                  }}
                  disabled={addingTodo}
                />
                <Button 
                  onClick={handleAddTodo}
                  disabled={!newTodoTitle.trim() || addingTodo}
                >
                  {addingTodo ? 'Adding...' : 'Add Todo'}
                </Button>
              </div>
              
              {/* Todo list */}
              {todos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Upload documents to extract todos or add one manually
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todos.map((todo) => {
                    const dueDateInfo = formatDueDate(todo.dueDate);
                    
                    return (
                      <div 
                        key={todo._id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox 
                          id={todo._id}
                          checked={todo.completed}
                          onCheckedChange={() => handleToggleComplete(todo._id, todo.completed)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <label 
                            htmlFor={todo._id}
                            className={`block text-sm font-medium leading-none cursor-pointer ${
                              todo.completed ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {todo.title}
                          </label>
                          
                          {todo.description && (
                            <p className={`mt-1 text-sm ${
                              todo.completed ? 'text-muted-foreground' : 'text-muted-foreground/80'
                            }`}>
                              {todo.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {todo.category && (
                              <Badge variant="outline" className="text-xs">
                                {todo.category}
                              </Badge>
                            )}
                            
                            {todo.priority && (
                              <Badge 
                                variant={getPriorityBadge(todo.priority) as 'destructive' | 'default' | 'secondary'}
                                className="text-xs"
                              >
                                {todo.priority}
                              </Badge>
                            )}
                            
                            {dueDateInfo && (
                              <Badge 
                                variant={dueDateInfo.urgent ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {dueDateInfo.text}
                              </Badge>
                            )}
                            
                            {todo.tags && todo.tags.length > 0 && (
                              <>
                                {todo.tags.slice(0, 3).map((tag, idx) => (
                                  <Badge 
                                    key={idx}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {todo.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{todo.tags.length - 3}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTodo(todo._id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
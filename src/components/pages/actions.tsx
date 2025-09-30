'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface Task {
  _id: string;
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'pending' | 'in-progress' | 'completed' | 'archived';
  dueDate?: string;
  estimatedTime?: string;
  tags?: string[];
}

export default function ActionsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      if (data.success) {
        setTasks(data.data.tasks || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, updates: { status: newStatus } }),
      });
      
      if (response.ok) {
        await fetchTasks(); // Refresh the list
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'outline',
      'in-progress': 'default',
      completed: 'secondary',
      archived: 'secondary',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Actions</h2>
          <p className="text-muted-foreground">
            All extracted action items from your documents in one place.
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
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
          <h2 className="text-3xl font-bold tracking-tight">Actions</h2>
          <p className="text-muted-foreground">
            All extracted action items from your documents in one place.
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Actions</h2>
        <p className="text-muted-foreground">
          All extracted action items from your documents in one place.
        </p>
      </div>
      
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Action Items Overview</CardTitle>
              <Badge variant="secondary">{activeTasks.length} Active</Badge>
            </div>
            <CardDescription>
              Manage and organize all your extracted action items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No action items yet. Upload documents to extract tasks.</p>
                </div>
              ) : (
                tasks.map((task, index) => (
                  <div key={task._id}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                          {task.category && (
                            <Badge variant="outline">{task.category}</Badge>
                          )}
                          {task.dueDate && (
                            <Badge variant="outline">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </Badge>
                          )}
                          {task.estimatedTime && (
                            <Badge variant="outline">{task.estimatedTime}</Badge>
                          )}
                        </div>
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {task.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {task.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusUpdate(task.id, 'in-progress')}
                          >
                            Start
                          </Button>
                        )}
                        {task.status === 'in-progress' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusUpdate(task.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
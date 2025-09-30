'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  Calendar, 
  Mail, 
  ListTodo, 
  FileCheck2,
  ChevronRight,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Filter
} from "lucide-react";

interface ActivityItem {
  type: 'task' | 'event' | 'mail' | 'todo';
  title: string;
  count: number;
  timestamp: Date;
  userPrompt?: string;
  actionMode?: string;
  files?: { name: string; type: string }[];
}

export default function ActivityPage() {
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadRecentActivity = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/activities?type=${filterType}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.activities) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const activities: ActivityItem[] = data.activities.map((act: any) => ({
            type: act.type,
            title: act.title,
            count: act.count,
            timestamp: new Date(act.createdAt),
            userPrompt: act.userPrompt,
            actionMode: act.actionMode,
            files: act.files,
          }));
          setRecentActivity(activities);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to fetch from database:', error);
    }

    try {
      const activity: ActivityItem[] = [];
      const savedMessages = localStorage.getItem('chatMessages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parsed.forEach((msg: any) => {
          if (msg.results && msg.type === 'user') {
            const userPrompt = msg.content || 'Processing attached files...';
            const actionMode = msg.actionMode;
            const files = msg.files;
            
            if (msg.results.tasksCreated) {
              activity.push({
                type: 'task',
                title: 'Tasks Created',
                count: msg.results.tasksCreated,
                timestamp: new Date(msg.timestamp),
                userPrompt,
                actionMode,
                files
              });
            }
            if (msg.results.calendarEvents) {
              activity.push({
                type: 'event',
                title: 'Events Added',
                count: msg.results.calendarEvents,
                timestamp: new Date(msg.timestamp),
                userPrompt,
                actionMode,
                files
              });
            }
            if (msg.results.mailDrafts) {
              activity.push({
                type: 'mail',
                title: 'Emails Drafted',
                count: msg.results.mailDrafts,
                timestamp: new Date(msg.timestamp),
                userPrompt,
                actionMode,
                files
              });
            }
            if (msg.results.todoItems) {
              activity.push({
                type: 'todo',
                title: 'Todos Created',
                count: msg.results.todoItems,
                timestamp: new Date(msg.timestamp),
                userPrompt,
                actionMode,
                files
              });
            }
          }
        });
        activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }
      setRecentActivity(activity);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    
    setLoading(false);
  }, [filterType]);

  useEffect(() => {
    loadRecentActivity();
  }, [loadRecentActivity]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task': return <FileCheck2 className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'mail': return <Mail className="h-4 w-4" />;
      case 'todo': return <ListTodo className="h-4 w-4" />;
      default: return <FileCheck2 className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task': return 'from-blue-500 to-blue-600';
      case 'event': return 'from-green-500 to-green-600';
      case 'mail': return 'from-purple-500 to-purple-600';
      case 'todo': return 'from-orange-500 to-orange-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getModeBadgeColor = (mode?: string) => {
    switch (mode) {
      case 'todo': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'action': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'mail': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'calendar': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredActivity = filterType === 'all' 
    ? recentActivity 
    : recentActivity.filter(item => item.type === filterType);

  const filterOptions = [
    { value: 'all', label: 'All', icon: <Sparkles className="h-3 w-3" /> },
    { value: 'task', label: 'Tasks', icon: <FileCheck2 className="h-3 w-3" /> },
    { value: 'event', label: 'Events', icon: <Calendar className="h-3 w-3" /> },
    { value: 'mail', label: 'Emails', icon: <Mail className="h-3 w-3" /> },
    { value: 'todo', label: 'Todos', icon: <ListTodo className="h-3 w-3" /> },
  ];

  return (
    <div className="space-y-6 h-full overflow-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
          <p className="text-muted-foreground mt-2">
            Track your recent automation activities and see what&apos;s been created
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterType(option.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  filterType === option.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Tasks</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {recentActivity.filter(a => a.type === 'task').reduce((sum, a) => sum + a.count, 0)}
                  </p>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <FileCheck2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Events</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {recentActivity.filter(a => a.type === 'event').reduce((sum, a) => sum + a.count, 0)}
                  </p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Emails</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {recentActivity.filter(a => a.type === 'mail').reduce((sum, a) => sum + a.count, 0)}
                  </p>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Todos</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {recentActivity.filter(a => a.type === 'todo').reduce((sum, a) => sum + a.count, 0)}
                  </p>
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                <ListTodo className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-purple-500/5">
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <History className="h-5 w-5 text-white" />
            </div>
            Activity Timeline
            <Badge className="ml-auto">{filteredActivity.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-16 px-4">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading activities...</p>
            </div>
          ) : filteredActivity.length === 0 ? (
            <div className="text-center py-16 px-4">
              <History className="h-20 w-20 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-lg font-semibold text-foreground mb-2">
                {filterType === 'all' ? 'No recent activity' : `No ${filterType} activities found`}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                {filterType === 'all' 
                  ? 'Start processing documents or creating items in the Home tab to see your activity here.'
                  : 'Try selecting a different filter or create some items in the Home tab.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivity.map((item, idx) => (
                <Card 
                  key={idx} 
                  className="group border-2 transition-all hover:shadow-xl hover:border-primary/30 cursor-pointer overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4 p-5">
                      {/* Icon */}
                      <div className={`p-4 rounded-2xl shadow-lg bg-gradient-to-br ${getTypeColor(item.type)} shrink-0`}>
                        <div className="text-white">
                          {getActivityIcon(item.type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold">{item.title}</h3>
                              <Badge variant="outline" className="text-xs font-medium">
                                {item.count} item{item.count !== 1 ? 's' : ''}
                              </Badge>
                              {item.actionMode && (
                                <Badge className={`text-xs font-medium border ${getModeBadgeColor(item.actionMode)}`}>
                                  {item.actionMode}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              {item.timestamp.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })} at {item.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                        </div>

                        {/* User Prompt */}
                        {item.userPrompt && item.userPrompt !== 'Processing attached files...' && (
                          <div className="bg-muted/50 rounded-lg p-3 border border-border">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Your prompt:</p>
                                <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                                  {item.userPrompt}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Files */}
                        {item.files && item.files.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.files.map((file, fileIdx) => (
                              <Badge 
                                key={fileIdx} 
                                variant="secondary" 
                                className="text-xs font-normal flex items-center gap-1"
                              >
                                <FileCheck2 className="h-3 w-3" />
                                {file.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  History, 
  Calendar, 
  Mail, 
  ListTodo, 
  FileCheck2,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface ActivityItem {
  type: 'task' | 'event' | 'mail' | 'todo';
  title: string;
  count: number;
  timestamp: Date;
}

interface ActivitySidebarProps {
  visible?: boolean;
}

export default function ActivitySidebar({ visible = true }: ActivitySidebarProps) {
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = () => {
    const activity: ActivityItem[] = [];
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parsed.forEach((msg: any) => {
          if (msg.results) {
            if (msg.results.tasksCreated) {
              activity.push({
                type: 'task',
                title: 'Tasks Created',
                count: msg.results.tasksCreated,
                timestamp: new Date(msg.timestamp)
              });
            }
            if (msg.results.calendarEvents) {
              activity.push({
                type: 'event',
                title: 'Events Added',
                count: msg.results.calendarEvents,
                timestamp: new Date(msg.timestamp)
              });
            }
            if (msg.results.mailDrafts) {
              activity.push({
                type: 'mail',
                title: 'Emails Drafted',
                count: msg.results.mailDrafts,
                timestamp: new Date(msg.timestamp)
              });
            }
            if (msg.results.todoItems) {
              activity.push({
                type: 'todo',
                title: 'Todos Created',
                count: msg.results.todoItems,
                timestamp: new Date(msg.timestamp)
              });
            }
          }
        });
      } catch (error) {
        console.error('Failed to load activity:', error);
      }
    }
    setRecentActivity(activity.slice(0, 5));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task': return <FileCheck2 className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'mail': return <Mail className="h-4 w-4" />;
      case 'todo': return <ListTodo className="h-4 w-4" />;
      default: return <FileCheck2 className="h-4 w-4" />;
    }
  };

  if (!visible) return null;

  return (
    <Card className="w-full border-l-2 border-t-0 border-r-0 border-b-0 rounded-none shadow-2xl bg-gradient-to-br from-background to-muted/10 backdrop-blur-xl">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-purple-500/5">
        <CardTitle className="text-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <History className="h-5 w-5 text-white" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4">
          {recentActivity.length === 0 ? (
            <div className="text-center py-12 px-4">
              <History className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-sm font-semibold text-foreground mb-2">No recent activity</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Start processing documents to see your activity here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, idx) => (
                <div 
                  key={idx} 
                  className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-accent/40 to-accent/20 hover:from-accent/60 hover:to-accent/40 border-2 border-border/50 transition-all cursor-pointer hover:shadow-lg"
                >
                  <div className={`p-3 rounded-xl shadow-md ${
                    item.type === 'task' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    item.type === 'event' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                    item.type === 'mail' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                    'bg-gradient-to-br from-orange-500 to-orange-600'
                  }`}>
                    <div className="text-white">
                      {getActivityIcon(item.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count} item{item.count !== 1 ? 's' : ''} • {item.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )}

          <Separator className="my-6" />
          
          {/* Quick Stats */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="group p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/20 transition-all cursor-pointer hover:border-blue-500/40">
                <FileCheck2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {recentActivity.filter(a => a.type === 'task').reduce((sum, a) => sum + a.count, 0)}
                </div>
                <div className="text-xs font-medium text-muted-foreground">Tasks</div>
              </div>
              <div className="group p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/20 transition-all cursor-pointer hover:border-green-500/40">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400 mb-2" />
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {recentActivity.filter(a => a.type === 'event').reduce((sum, a) => sum + a.count, 0)}
                </div>
                <div className="text-xs font-medium text-muted-foreground">Events</div>
              </div>
              <div className="group p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/20 transition-all cursor-pointer hover:border-purple-500/40">
                <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {recentActivity.filter(a => a.type === 'mail').reduce((sum, a) => sum + a.count, 0)}
                </div>
                <div className="text-xs font-medium text-muted-foreground">Emails</div>
              </div>
              <div className="group p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/20 transition-all cursor-pointer hover:border-orange-500/40">
                <ListTodo className="h-5 w-5 text-orange-600 dark:text-orange-400 mb-2" />
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  {recentActivity.filter(a => a.type === 'todo').reduce((sum, a) => sum + a.count, 0)}
                </div>
                <div className="text-xs font-medium text-muted-foreground">Todos</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

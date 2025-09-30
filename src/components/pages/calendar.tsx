'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface CalendarEvent {
  _id: string;
  id: string;
  title: string;
  description?: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  attendees?: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(
        `/api/calendar?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      if (data.success) {
        setEvents(data.data.events || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300',
    } as const;
    
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Previous month padding
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">
            Timeline and deadline view of your tasks and events.
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">
            Timeline and deadline view of your tasks and events.
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

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
        <p className="text-muted-foreground">
          Timeline and deadline view of your tasks and events.
        </p>
      </div>
      
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  Next
                </Button>
              </div>
            </div>
            <CardDescription>
              Color-coded events by priority with timeline view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 min-h-[400px]">
                {calendarDays.map((date, i) => (
                  <div 
                    key={i} 
                    className={`border rounded p-2 min-h-[100px] relative ${
                      date ? 'bg-background' : 'bg-muted/30'
                    }`}
                  >
                    {date && (
                      <>
                        <span className={`text-sm font-medium ${
                          date.toDateString() === new Date().toDateString()
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground'
                        }`}>
                          {date.getDate()}
                        </span>
                        <div className="mt-1 space-y-1">
                          {getEventsForDate(date).map((event) => (
                            <div 
                              key={event._id} 
                              className={`text-xs p-1 rounded border ${getPriorityColor(event.priority)}`}
                              title={event.description || event.title}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              {event.startTime && (
                                <div className="text-xs opacity-75">{event.startTime}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">High Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Medium Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm">Low Priority</span>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  {events.length} event{events.length !== 1 ? 's' : ''} this month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
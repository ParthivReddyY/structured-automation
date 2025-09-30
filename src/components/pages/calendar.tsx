'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus, 
  Clock, 
  MapPin, 
  Users,
  Bell,
  Edit,
  Trash2,
  CalendarDays,
  List,
  LayoutGrid
} from "lucide-react"
import { toast } from "sonner"

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
  reminders?: string[];
  sourceDocumentId?: string;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  attendees: string;
  priority: 'low' | 'medium' | 'high';
  reminders: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    attendees: '',
    priority: 'medium',
    reminders: '',
  });

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/calendar');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch events');
      }
      
      const data = await response.json();
      console.log('Fetched events:', data);
      
      if (data.success) {
        setEvents(data.data.events || []);
      } else {
        throw new Error(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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
      high: 'bg-red-500/90 dark:bg-red-600/90 border-red-600 dark:border-red-500 text-white',
      medium: 'bg-yellow-500/90 dark:bg-yellow-600/90 border-yellow-600 dark:border-yellow-500 text-white',
      low: 'bg-green-500/90 dark:bg-green-600/90 border-green-600 dark:border-green-500 text-white',
    } as const;
    
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    } as const;
    
    return variants[priority as keyof typeof variants] || variants.low;
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    setFormData(prev => ({
      ...prev,
      startDate: date.toISOString().split('T')[0],
      endDate: date.toISOString().split('T')[0],
    }));
    setIsDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.startDate) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startDate: new Date(`${formData.startDate}T${formData.startTime || '00:00'}`),
          startTime: formData.startTime,
          endDate: formData.endDate ? new Date(`${formData.endDate}T${formData.endTime || '23:59'}`) : undefined,
          endTime: formData.endTime,
          location: formData.location,
          attendees: formData.attendees ? formData.attendees.split(',').map(a => a.trim()) : [],
          priority: formData.priority,
          reminders: formData.reminders ? formData.reminders.split(',').map(r => r.trim()) : [],
        }),
      });

      if (!response.ok) throw new Error('Failed to create event');

      const data = await response.json();
      if (data.success) {
        toast.success('Event created successfully!');
        setIsDialogOpen(false);
        resetForm();
        await fetchEvents();
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/calendar?id=${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');

      toast.success('Event deleted successfully!');
      setIsDetailsOpen(false);
      setSelectedEvent(null);
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      location: '',
      attendees: '',
      priority: 'medium',
      reminders: '',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">
            Manage your schedule and events
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
            Manage your schedule and events
          </p>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-destructive">{error}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => fetchEvents()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Calendar
          </h2>
          <p className="text-muted-foreground">
            Manage your schedule and events
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}>
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Add a new event to your calendar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Event description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Event location or meeting link"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendees">Attendees</Label>
                <Input
                  id="attendees"
                  value={formData.attendees}
                  onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
                  placeholder="Comma-separated emails or names"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}>
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
                <Label htmlFor="reminders">Reminders</Label>
                <Input
                  id="reminders"
                  value={formData.reminders}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminders: e.target.value }))}
                  placeholder="e.g., 15 minutes before, 1 day before"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent}>
                Create Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week' | 'list')}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="month" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Month
          </TabsTrigger>
          <TabsTrigger value="week" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Week
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            List
          </TabsTrigger>
        </TabsList>

        {/* Month View */}
        <TabsContent value="month" className="mt-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex gap-2">
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-r-none" onClick={() => navigateYear('prev')} title="Previous Year">
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-x" onClick={() => navigateMonth('prev')} title="Previous Month">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="h-9 rounded-none border-r" onClick={goToToday}>
                      Today
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-r" onClick={() => navigateMonth('next')} title="Next Month">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-l-none" onClick={() => navigateYear('next')} title="Next Year">
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span>{events.length} event{events.length !== 1 ? 's' : ''} total</span>
                <span>•</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs">High</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-xs">Medium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-xs">Low</span>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2">{day}</div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((date, i) => {
                    const dayEvents = date ? getEventsForDate(date) : [];
                    const isToday = date?.toDateString() === today.toDateString();
                    
                    return (
                      <div 
                        key={i} 
                        className={`min-h-[120px] border-2 rounded-lg p-2 transition-all ${
                          date 
                            ? `bg-background hover:bg-accent/50 cursor-pointer ${isToday ? 'border-primary ring-2 ring-primary/20' : 'border-border'}` 
                            : 'bg-muted/30 border-muted'
                        }`}
                        onClick={() => handleDateClick(date)}
                      >
                        {date && (
                          <>
                            <div className={`text-sm font-semibold mb-1 ${
                              isToday ? 'text-primary' : 'text-foreground'
                            }`}>
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.slice(0, 2).map((event) => (
                                <TooltipProvider key={event._id} delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div 
                                        className={`text-xs p-2 rounded-md border-l-4 ${getPriorityColor(event.priority)} truncate hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEventClick(event);
                                        }}
                                      >
                                        <div className="font-bold truncate text-white">{event.title}</div>
                                        {event.startTime && (
                                          <div className="text-[10px] flex items-center gap-1 mt-1 text-white/95">
                                            <Clock className="h-3 w-3" />
                                            <span className="font-medium">{event.startTime}</span>
                                          </div>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={10} className="max-w-sm border-2 shadow-xl bg-popover text-popover-foreground backdrop-blur-sm p-3">
                                      <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <p className="font-bold text-base text-foreground">{event.title}</p>
                                          <Badge 
                                            variant="outline" 
                                            className={`text-xs shrink-0 font-semibold ${
                                              event.priority === 'high' 
                                                ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50' 
                                                : event.priority === 'medium' 
                                                ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/50'
                                                : 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50'
                                            }`}
                                          >
                                            {event.priority}
                                          </Badge>
                                        </div>
                                        {event.description && (
                                          <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/50 pl-3 py-1">
                                            {event.description}
                                          </p>
                                        )}
                                        <div className="space-y-2 text-sm bg-muted/50 rounded-lg p-3 border border-border">
                                          {event.startTime && (
                                            <div className="flex items-center gap-2 text-foreground">
                                              <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                                              <span className="font-semibold">{event.startTime}{event.endTime && ` - ${event.endTime}`}</span>
                                            </div>
                                          )}
                                          {event.location && (
                                            <div className="flex items-center gap-2 text-foreground">
                                              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                              <span className="font-semibold">{event.location}</span>
                                            </div>
                                          )}
                                          {event.attendees && (
                                            <div className="flex items-center gap-2 text-foreground">
                                              <Users className="h-4 w-4 text-primary flex-shrink-0" />
                                              <span className="font-semibold">{event.attendees}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-xs text-muted-foreground font-medium">
                                  +{dayEvents.length - 2} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle>All Events</CardTitle>
              <CardDescription>
                {events.length} event{events.length !== 1 ? 's' : ''} in your calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] [&>div>div]:!overflow-visible [&>div]:!overflow-auto [&>div]:scrollbar-none [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none] [&>div::-webkit-scrollbar]:hidden">
                {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No events found</p>
                    <p className="text-sm">Create your first event to get started</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {events.map((event) => (
                      <div 
                        key={event._id}
                        className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-1 h-full ${getPriorityColor(event.priority)} rounded-full`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{event.title}</h3>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                              <Badge variant={getPriorityBadge(event.priority)}>
                                {event.priority}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <CalendarIcon className="h-4 w-4" />
                                {new Date(event.startDate).toLocaleDateString()}
                              </div>
                              {event.startTime && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" />
                                  {event.startTime}
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </div>
                              )}
                              {event.attendees && event.attendees.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Users className="h-4 w-4" />
                                  {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Week View - Placeholder */}
        <TabsContent value="week" className="mt-6">
          <Card className="border-2 shadow-lg">
            <CardContent className="py-12 text-center text-muted-foreground">
              <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Week View Coming Soon</p>
              <p className="text-sm">This feature is under development</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedEvent.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getPriorityBadge(selectedEvent.priority)}>
                        {selectedEvent.priority}
                      </Badge>
                      <Badge variant="outline">{selectedEvent.status}</Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedEvent.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date:</span>
                    <span>{new Date(selectedEvent.startDate).toLocaleDateString()}</span>
                  </div>
                  
                  {selectedEvent.startTime && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Time:</span>
                      <span>{selectedEvent.startTime} {selectedEvent.endTime && `- ${selectedEvent.endTime}`}</span>
                    </div>
                  )}
                  
                  {selectedEvent.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Location:</span>
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  
                  {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <span className="font-medium">Attendees:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedEvent.attendees.map((attendee, idx) => (
                            <Badge key={idx} variant="secondary">{attendee}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedEvent.reminders && selectedEvent.reminders.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                      <Bell className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <span className="font-medium">Reminders:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedEvent.reminders.map((reminder, idx) => (
                            <Badge key={idx} variant="outline">{reminder}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    toast.info('Edit functionality coming soon');
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

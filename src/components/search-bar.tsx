'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, FileCheck2, ListTodo, Calendar, Mail, History, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  type: 'task' | 'todo' | 'event' | 'mail' | 'activity';
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  activityType?: string;
  count?: number;
}

interface SearchBarProps {
  onNavigate: (page: string, itemId?: string) => void;
  onOpenSearchPage?: (query: string) => void;
}

export default function SearchBar({ onNavigate, onOpenSearchPage }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    tasks: SearchResult[];
    todos: SearchResult[];
    events: SearchResult[];
    mails: SearchResult[];
    activities: SearchResult[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults(null);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.results);
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (type: string, itemId: string) => {
    setShowResults(false);
    setSearchQuery('');
    
    switch (type) {
      case 'task':
        onNavigate('actions', itemId);
        break;
      case 'todo':
        onNavigate('todos', itemId);
        break;
      case 'event':
        onNavigate('calendar', itemId);
        break;
      case 'mail':
        onNavigate('mails', itemId);
        break;
      case 'activity':
        onNavigate('activity', itemId);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim() && onOpenSearchPage) {
      e.preventDefault();
      setShowResults(false);
      onOpenSearchPage(searchQuery);
      setSearchQuery(''); // Clear search field after opening results page
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <FileCheck2 className="h-4 w-4 text-blue-500" />;
      case 'todo':
        return <ListTodo className="h-4 w-4 text-orange-500" />;
      case 'event':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'mail':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'activity':
        return <History className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  const totalResults = searchResults
    ? searchResults.tasks.length +
      searchResults.todos.length +
      searchResults.events.length +
      searchResults.mails.length +
      searchResults.activities.length
    : 0;

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks, todos, events, emails... (Press Enter for full results)"
          className="pl-8 pr-8 bg-background"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchResults && totalResults > 0) {
              setShowResults(true);
            }
          }}
          onKeyDown={handleKeyDown}
        />
        {isSearching && (
          <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && searchResults && totalResults > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-[9999] shadow-2xl border-2 bg-background backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="p-3 border-b bg-muted/50">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Search className="h-4 w-4" />
                {totalResults} result{totalResults !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="max-h-[400px] overflow-y-auto search-dropdown-scroll">
              <div className="p-2">
                {/* Tasks */}
                {searchResults.tasks.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                      ACTIONS ({searchResults.tasks.length})
                    </p>
                    {searchResults.tasks.map((task, idx) => (
                      <button
                        key={`task-${task.id}-${idx}`}
                        onClick={() => handleResultClick('task', task.id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors flex items-start gap-3 group"
                      >
                        {getIcon('task')}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {task.priority && (
                              <Badge variant="secondary" className="text-xs">
                                {task.priority}
                              </Badge>
                            )}
                            {task.status && (
                              <Badge variant="outline" className="text-xs">
                                {task.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Todos */}
                {searchResults.todos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                      TODOS ({searchResults.todos.length})
                    </p>
                    {searchResults.todos.map((todo, idx) => (
                      <button
                        key={`todo-${todo.id}-${idx}`}
                        onClick={() => handleResultClick('todo', todo.id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors flex items-start gap-3 group"
                      >
                        {getIcon('todo')}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary">
                            {todo.title}
                          </p>
                          {todo.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {todo.description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Events */}
                {searchResults.events.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                      EVENTS ({searchResults.events.length})
                    </p>
                    {searchResults.events.map((event, idx) => (
                      <button
                        key={`event-${event.id}-${idx}`}
                        onClick={() => handleResultClick('event', event.id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors flex items-start gap-3 group"
                      >
                        {getIcon('event')}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary">
                            {event.title}
                          </p>
                          {event.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mails */}
                {searchResults.mails.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                      EMAILS ({searchResults.mails.length})
                    </p>
                    {searchResults.mails.map((mail, idx) => (
                      <button
                        key={`mail-${mail.id}-${idx}`}
                        onClick={() => handleResultClick('mail', mail.id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors flex items-start gap-3 group"
                      >
                        {getIcon('mail')}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary">
                            {mail.title}
                          </p>
                          {mail.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {mail.description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Activities */}
                {searchResults.activities.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                      ACTIVITIES ({searchResults.activities.length})
                    </p>
                    {searchResults.activities.map((activity, idx) => (
                      <button
                        key={`activity-${activity.id}-${idx}`}
                        onClick={() => handleResultClick('activity', activity.id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors flex items-start gap-3 group"
                      >
                        {getIcon('activity')}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary">
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {activity.description}
                            </p>
                          )}
                          {activity.count && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {activity.count} item{activity.count !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showResults && searchResults && totalResults === 0 && !isSearching && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-[9999] shadow-2xl border-2 bg-background backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No results found</p>
            <p className="text-xs text-muted-foreground">
              Try searching with different keywords
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

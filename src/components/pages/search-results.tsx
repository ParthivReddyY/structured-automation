'use client';

import { useState, useEffect } from 'react';
import { Search, FileCheck2, ListTodo, Calendar, Mail, History, Loader2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchResult {
  id: string;
  type: 'task' | 'todo' | 'event' | 'mail' | 'activity';
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  activityType?: string;
  count?: number;
  category?: string;
  dueDate?: Date;
  startDate?: Date;
  to?: string;
  createdAt?: Date;
}

interface SearchResultsPageProps {
  initialQuery?: string;
  onNavigate: (page: string, itemId?: string) => void;
}

export default function SearchResultsPage({ initialQuery = '', onNavigate }: SearchResultsPageProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<{
    tasks: SearchResult[];
    todos: SearchResult[];
    events: SearchResult[];
    mails: SearchResult[];
    activities: SearchResult[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (query: string) => {
    if (query.trim().length < 2) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.results);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (type: string, itemId: string) => {
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <FileCheck2 className="h-5 w-5 text-blue-500" />;
      case 'todo':
        return <ListTodo className="h-5 w-5 text-orange-500" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'mail':
        return <Mail className="h-5 w-5 text-purple-500" />;
      case 'activity':
        return <History className="h-5 w-5 text-primary" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'from-blue-500/10 to-blue-600/10 border-blue-500/20 hover:border-blue-500/40';
      case 'todo':
        return 'from-orange-500/10 to-orange-600/10 border-orange-500/20 hover:border-orange-500/40';
      case 'event':
        return 'from-green-500/10 to-green-600/10 border-green-500/20 hover:border-green-500/40';
      case 'mail':
        return 'from-purple-500/10 to-purple-600/10 border-purple-500/20 hover:border-purple-500/40';
      case 'activity':
        return 'from-primary/10 to-primary/20 border-primary/20 hover:border-primary/40';
      default:
        return '';
    }
  };

  const totalResults = searchResults
    ? searchResults.tasks.length +
      searchResults.todos.length +
      searchResults.events.length +
      searchResults.mails.length +
      searchResults.activities.length
    : 0;

  const renderResultCard = (result: SearchResult, idx: number) => (
    <Card
      key={`${result.type}-${result.id}-${idx}`}
      className={`group cursor-pointer transition-all hover:shadow-lg border-2 bg-gradient-to-br ${getTypeColor(result.type)}`}
      onClick={() => handleResultClick(result.type, result.id)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
            {getIcon(result.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                  {result.title}
                </h3>
                {result.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {result.description}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="secondary" className="text-xs font-medium">
                {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
              </Badge>
              
              {result.priority && (
                <Badge variant="outline" className="text-xs">
                  {result.priority}
                </Badge>
              )}
              
              {result.status && (
                <Badge variant="outline" className="text-xs">
                  {result.status}
                </Badge>
              )}
              
              {result.category && (
                <Badge variant="secondary" className="text-xs">
                  {result.category}
                </Badge>
              )}
              
              {result.count !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  {result.count} item{result.count !== 1 ? 's' : ''}
                </Badge>
              )}

              {result.dueDate && (
                <Badge variant="outline" className="text-xs">
                  Due: {new Date(result.dueDate).toLocaleDateString()}
                </Badge>
              )}

              {result.startDate && (
                <Badge variant="outline" className="text-xs">
                  {new Date(result.startDate).toLocaleDateString()}
                </Badge>
              )}

              {result.to && (
                <Badge variant="outline" className="text-xs">
                  To: {result.to}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const allResults = searchResults
    ? [
        ...searchResults.tasks,
        ...searchResults.todos,
        ...searchResults.events,
        ...searchResults.mails,
        ...searchResults.activities,
      ]
    : [];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
        <p className="text-muted-foreground mt-2">
          Find tasks, todos, events, emails, and activities across your workspace
        </p>
      </div>

      {/* Search Bar */}
      <Card className="border-2 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search across all items..."
                className="pl-10 h-11 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
              size="lg"
              className="px-6"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isSearching ? (
        <Card className="flex-1">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Searching...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Looking through tasks, todos, events, emails, and activities
              </p>
            </div>
          </CardContent>
        </Card>
      ) : searchResults === null ? (
        <Card className="flex-1">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <Search className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">Start Your Search</p>
              <p className="text-sm text-muted-foreground">
                Enter a search term above to find items across your entire workspace
              </p>
            </div>
          </CardContent>
        </Card>
      ) : totalResults === 0 ? (
        <Card className="flex-1">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <Search className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">No Results Found</p>
              <p className="text-sm text-muted-foreground mb-4">
                We couldn&apos;t find any items matching &quot;{searchQuery}&quot;
              </p>
              <p className="text-xs text-muted-foreground">
                Try using different keywords or check your spelling
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col border-2 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-purple-500/5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                  <Search className="h-5 w-5 text-white" />
                </div>
                Search Results for &quot;{searchQuery}&quot;
              </CardTitle>
              <Badge className="text-sm px-3 py-1">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-6">
              <TabsList className="bg-transparent h-12">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary/10">
                  All ({totalResults})
                </TabsTrigger>
                <TabsTrigger 
                  value="tasks" 
                  className="data-[state=active]:bg-blue-500/10"
                  disabled={searchResults.tasks.length === 0}
                >
                  <FileCheck2 className="h-4 w-4 mr-1" />
                  Actions ({searchResults.tasks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="todos" 
                  className="data-[state=active]:bg-orange-500/10"
                  disabled={searchResults.todos.length === 0}
                >
                  <ListTodo className="h-4 w-4 mr-1" />
                  Todos ({searchResults.todos.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="events" 
                  className="data-[state=active]:bg-green-500/10"
                  disabled={searchResults.events.length === 0}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Events ({searchResults.events.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="mails" 
                  className="data-[state=active]:bg-purple-500/10"
                  disabled={searchResults.mails.length === 0}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Emails ({searchResults.mails.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="activities" 
                  className="data-[state=active]:bg-primary/10"
                  disabled={searchResults.activities.length === 0}
                >
                  <History className="h-4 w-4 mr-1" />
                  Activities ({searchResults.activities.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                <TabsContent value="all" className="mt-0">
                  <div className="grid gap-4">
                    {allResults.map((result, idx) => renderResultCard(result, idx))}
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="mt-0">
                  <div className="grid gap-4">
                    {searchResults.tasks.map((task, idx) => renderResultCard(task, idx))}
                  </div>
                </TabsContent>

                <TabsContent value="todos" className="mt-0">
                  <div className="grid gap-4">
                    {searchResults.todos.map((todo, idx) => renderResultCard(todo, idx))}
                  </div>
                </TabsContent>

                <TabsContent value="events" className="mt-0">
                  <div className="grid gap-4">
                    {searchResults.events.map((event, idx) => renderResultCard(event, idx))}
                  </div>
                </TabsContent>

                <TabsContent value="mails" className="mt-0">
                  <div className="grid gap-4">
                    {searchResults.mails.map((mail, idx) => renderResultCard(mail, idx))}
                  </div>
                </TabsContent>

                <TabsContent value="activities" className="mt-0">
                  <div className="grid gap-4">
                    {searchResults.activities.map((activity, idx) => renderResultCard(activity, idx))}
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </Card>
      )}
    </div>
  );
}

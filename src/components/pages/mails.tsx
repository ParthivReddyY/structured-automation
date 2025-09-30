'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface MailDraft {
  _id: string;
  id: string;
  to?: string;
  subject: string;
  body: string;
  context: string;
  tone: 'formal' | 'casual' | 'professional' | 'friendly';
  priority: 'low' | 'medium' | 'high';
  category: 'customer_support' | 'project_update' | 'meeting_invitation' | 'general';
  status: 'draft' | 'sent' | 'archived';
}

export default function MailsPage() {
  const [drafts, setDrafts] = useState<MailDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mails');
      if (!response.ok) throw new Error('Failed to fetch mail drafts');
      
      const data = await response.json();
      if (data.success) {
        setDrafts(data.data.drafts || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (draft: MailDraft) => {
    const emailText = `Subject: ${draft.subject}\n\n${draft.body}`;
    try {
      await navigator.clipboard.writeText(emailText);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleStatusUpdate = async (draftId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/mails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          draftId, 
          updates: { 
            status: newStatus,
            ...(newStatus === 'sent' ? { sentAt: new Date() } : {})
          } 
        }),
      });
      
      if (response.ok) {
        await fetchDrafts(); // Refresh the list
      }
    } catch (err) {
      console.error('Failed to update draft:', err);
    }
  };

  const getCategoryBadge = (category: string) => {
    const labels = {
      customer_support: 'Support',
      project_update: 'Project Update',
      meeting_invitation: 'Meeting',
      general: 'General',
    } as const;
    
    return <Badge variant="outline">{labels[category as keyof typeof labels] || category}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mails</h2>
          <p className="text-muted-foreground">
            AI-generated email drafts based on your documents and context.
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
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
          <h2 className="text-3xl font-bold tracking-tight">Mails</h2>
          <p className="text-muted-foreground">
            AI-generated email drafts based on your documents and context.
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mails</h2>
        <p className="text-muted-foreground">
          AI-generated email drafts based on your documents and context.
        </p>
      </div>
      
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Generated Email Drafts</CardTitle>
              <Badge variant="secondary">{drafts.length} Draft{drafts.length !== 1 ? 's' : ''}</Badge>
            </div>
            <CardDescription>
              Preview and copy AI-generated email content to your email client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {drafts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No email drafts yet. Upload documents to generate drafts.</p>
                </div>
              ) : (
                drafts.map((draft) => (
                  <div key={draft._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{draft.subject}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{draft.context}</p>
                        {draft.to && (
                          <p className="text-sm text-muted-foreground mt-1">To: {draft.to}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {getCategoryBadge(draft.category)}
                        {getPriorityBadge(draft.priority)}
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded text-sm max-h-64 overflow-y-auto">
                      <p className="font-medium mb-2">Subject: {draft.subject}</p>
                      <Separator className="my-2" />
                      <div className="whitespace-pre-wrap">{draft.body}</div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopy(draft)}
                      >
                        Copy to Clipboard
                      </Button>
                      {draft.status === 'draft' && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleStatusUpdate(draft.id, 'sent')}
                        >
                          Mark as Sent
                        </Button>
                      )}
                      {draft.status === 'draft' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusUpdate(draft.id, 'archived')}
                        >
                          Archive
                        </Button>
                      )}
                      <Badge variant="secondary" className="ml-auto">
                        {draft.tone.charAt(0).toUpperCase() + draft.tone.slice(1)} Tone
                      </Badge>
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
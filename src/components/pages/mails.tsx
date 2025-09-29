import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function MailsPage() {
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
              <Badge variant="secondary">3 Drafts</Badge>
            </div>
            <CardDescription>
              Preview and copy AI-generated email content to your email client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Project Update Report</h4>
                    <p className="text-sm text-muted-foreground">Generated from quarterly review notes</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">Support</Badge>
                    <Button variant="outline" size="sm">Copy</Button>
                  </div>
                </div>
                <div className="bg-muted p-3 rounded text-sm">
                  <p className="font-medium">Subject: Q4 Project Status Update</p>
                  <Separator className="my-2" />
                  <p>Dear Team,</p>
                  <p className="mt-2">I hope this email finds you well. I wanted to provide you with an update on our current project status...</p>
                  <p className="mt-2 text-muted-foreground">[Preview truncated]</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Client Meeting Follow-up</h4>
                    <p className="text-sm text-muted-foreground">Generated from meeting action items</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">General</Badge>
                    <Button variant="outline" size="sm">Copy</Button>
                  </div>
                </div>
                <div className="bg-muted p-3 rounded text-sm">
                  <p className="font-medium">Subject: Follow-up on Today&apos;s Meeting</p>
                  <Separator className="my-2" />
                  <p>Hi [Client Name],</p>
                  <p className="mt-2">Thank you for taking the time to meet with us today. As discussed, here are the key action items...</p>
                  <p className="mt-2 text-muted-foreground">[Preview truncated]</p>
                </div>
              </div>
              
              <div className="text-center py-8">
                <p className="text-muted-foreground">More email drafts will appear as you process documents...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
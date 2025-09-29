import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Clock, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-lg">
          Central hub for processing documents and extracting structured insights.
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* File Upload Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              Document Upload
            </CardTitle>
            <CardDescription className="text-base">
              Upload PDF, DOCX, or TXT files for AI processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop files here or click to browse
              </p>
              <Button variant="outline" className="px-6">Choose Files</Button>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Supported formats: PDF, DOCX, TXT • Max 10MB per file
            </div>
          </CardContent>
        </Card>

        {/* Text Input Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Direct Text Input</CardTitle>
            <CardDescription className="text-base">
              Paste unstructured notes for immediate processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid w-full gap-2">
              <Label htmlFor="notes" className="text-sm font-medium">Paste your notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Paste meeting notes, emails, or any unstructured text here..."
                className="min-h-[140px] resize-none"
              />
            </div>
            <Button className="w-full font-medium py-2">Process Text</Button>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            Processing Status
          </CardTitle>
          <CardDescription className="text-base">
            Current document processing queue and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-xl bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium">meeting-notes-dec-2024.pdf</p>
                  <p className="text-sm text-muted-foreground">Processed 2 minutes ago</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Complete
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-xl bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center gap-4">
                <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="font-medium">project-requirements.docx</p>
                  <p className="text-sm text-muted-foreground">Processing...</p>
                </div>
              </div>
              <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                In Progress
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Output Preview */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Extracted Tasks</CardTitle>
            <CardDescription className="text-base">
              Recently extracted action items and todos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Review quarterly reports</h4>
                  <Badge variant="destructive" className="text-xs">High</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Due: Dec 15, 2024</p>
              </div>
              
              <div className="p-4 border rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Schedule client meeting</h4>
                  <Badge variant="default" className="text-xs">Medium</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Due: Dec 20, 2024</p>
              </div>
              
              <Button variant="outline" className="w-full mt-6" size="sm">
                View All Actions →
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">AI Summary</CardTitle>
            <CardDescription className="text-base">
              Quick insights from your last processed document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border">
                <h4 className="font-medium mb-3">meeting-notes-dec-2024.pdf</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Document contains 3 action items, 2 deadlines, and 5 key discussion points. 
                  Main topics: quarterly review, budget planning, team restructuring.
                </p>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Confidence Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="w-[94%] h-full bg-green-500 rounded-full"></div>
                  </div>
                  <span className="font-medium text-sm">94%</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4" size="sm">
                View Full Summary →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
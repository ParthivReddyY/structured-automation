import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function ActionsPage() {
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
              <Badge variant="secondary">5 Active</Badge>
            </div>
            <CardDescription>
              Manage and organize all your extracted action items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">Review quarterly reports</h4>
                  <p className="text-sm text-muted-foreground">High priority task extracted from meeting notes</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">High Priority</Badge>
                    <Badge variant="outline">Due: Dec 15</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">Schedule client meeting</h4>
                  <p className="text-sm text-muted-foreground">Medium priority task from email thread</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Medium Priority</Badge>
                    <Badge variant="outline">Due: Dec 20</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
              
              <Separator />
              
              <div className="text-center py-8">
                <p className="text-muted-foreground">More action items will appear here...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function CalendarPage() {
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
              <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Week</Button>
                <Button variant="outline" size="sm">Month</Button>
              </div>
            </div>
            <CardDescription>
              Color-coded tasks by priority with timeline view
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
              
              <div className="grid grid-cols-7 gap-2 min-h-[300px]">
                {Array.from({ length: 35 }, (_, i) => (
                  <div key={i} className="border rounded p-2 min-h-[80px] relative">
                    <span className="text-sm text-muted-foreground">{((i % 30) + 1)}</span>
                    {i === 15 && (
                      <div className="mt-1">
                        <div className="text-xs bg-red-100 text-red-800 p-1 rounded mb-1">
                          <Badge variant="destructive" className="text-xs">High</Badge>
                          <div className="text-xs mt-1">Review reports</div>
                        </div>
                      </div>
                    )}
                    {i === 20 && (
                      <div className="mt-1">
                        <div className="text-xs bg-yellow-100 text-yellow-800 p-1 rounded">
                          <Badge variant="default" className="text-xs">Medium</Badge>
                          <div className="text-xs mt-1">Client meeting</div>
                        </div>
                      </div>
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
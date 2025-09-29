import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function TodosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">To-dos</h2>
        <p className="text-muted-foreground">
          Simple checklist-style task management for your daily tasks.
        </p>
      </div>
      
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Todo List</CardTitle>
              <Badge variant="secondary">3 Pending</Badge>
            </div>
            <CardDescription>
              Keep track of your daily tasks and check them off as you complete them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input placeholder="Add a new todo..." className="flex-1" />
                <Button>Add Todo</Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox id="todo1" />
                  <label htmlFor="todo1" className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Review project documentation
                  </label>
                  <Badge variant="outline">Work</Badge>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox id="todo2" checked />
                  <label htmlFor="todo2" className="flex-1 text-sm font-medium leading-none line-through text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Update team on progress
                  </label>
                  <Badge variant="outline">Work</Badge>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox id="todo3" />
                  <label htmlFor="todo3" className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Prepare presentation slides
                  </label>
                  <Badge variant="outline">Personal</Badge>
                </div>
                
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Add more todos to stay organized...</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
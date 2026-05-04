"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardList, Plus, CheckCircle2, Clock, Camera, Sparkles, Shield, Wrench } from "lucide-react"
import { mockTasks } from "@/lib/mock-data"
import { operationsService } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import type { UserRole } from "@/lib/types"

interface TasksPageProps {
  role: UserRole
}

export function TasksPage({ role }: TasksPageProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [tasks, setTasks] = useState(mockTasks)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    taskType: "temizlik",
    location: "",
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: "1"
  })
  const { toast } = useToast()

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setIsLoading(true)
    try {
      const data = await operationsService.getTasks()
      setTasks(data.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        category: t.category?.toLowerCase() || 'other',
        status: t.status === 'TAMAMLANDI' ? 'completed' : t.status === 'DEVAM_EDIYOR' ? 'in_progress' : 'pending',
        dueDate: t.dueDate || new Date().toISOString(),
        assignedTo: t.assignedTo || '',
      })))
    } catch (error) {
      // Silently fallback to mock data
      console.log('Using mock data for tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await operationsService.completeTask(taskId)
      toast({
        title: "Başarılı",
        description: "Görev tamamlandı",
      })
      loadTasks()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Görev tamamlanamadı",
        variant: "destructive",
      })
    }
  }

  const handleCreateTask = async () => {
    try {
      await operationsService.createTask(newTask)
      toast({
        title: "Başarılı",
        description: "Görev oluşturuldu",
      })
      setShowCreateDialog(false)
      setNewTask({
        title: "",
        description: "",
        taskType: "temizlik",
        location: "",
        dueDate: new Date().toISOString().split('T')[0],
        assignedTo: "1"
      })
      loadTasks()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Görev oluşturulamadı",
        variant: "destructive",
      })
    }
  }

  const filteredTasks = tasks
    .filter((t) => activeTab === "all" || t.status === activeTab)
    .filter((t) => role === "admin" || t.category === (role === "cleaner" ? "cleaning" : "security"))

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "cleaning":
        return Sparkles
      case "security":
        return Shield
      case "maintenance":
        return Wrench
      default:
        return ClipboardList
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "cleaning":
        return "bg-blue-500/10 text-blue-600"
      case "security":
        return "bg-amber-500/10 text-amber-600"
      case "maintenance":
        return "bg-emerald-500/10 text-emerald-600"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Bekliyor"
      case "in_progress":
        return "Devam Ediyor"
      case "completed":
        return "Tamamlandı"
      default:
        return status
    }
  }

  return (
    <div className="p-4 space-y-4 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Görevler</h2>
          <p className="text-xs text-muted-foreground">
            {filteredTasks.filter((t) => t.status !== "completed").length} bekleyen görev
          </p>
        </div>
        {role === "admin" && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 rounded-xl">
                <Plus className="w-4 h-4 mr-1" />
                Görev Ata
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Görev Oluştur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Başlık</Label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Görev başlığı"
                  />
                </div>
                <div>
                  <Label>Açıklama</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Görev açıklaması"
                  />
                </div>
                <div>
                  <Label>Görev Tipi</Label>
                  <Select value={newTask.taskType} onValueChange={(v) => setNewTask({ ...newTask, taskType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temizlik">Temizlik</SelectItem>
                      <SelectItem value="guvenlik">Güvenlik</SelectItem>
                      <SelectItem value="bakim">Bakım</SelectItem>
                      <SelectItem value="diger">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Konum</Label>
                  <Input
                    value={newTask.location}
                    onChange={(e) => setNewTask({ ...newTask, location: e.target.value })}
                    placeholder="Örn: A Blok"
                  />
                </div>
                <div>
                  <Label>Bitiş Tarihi</Label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateTask} className="w-full">
                  Görev Oluştur
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-10 bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg text-xs">
            Tümü
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg text-xs">
            Bekleyen
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg text-xs">
            Tamamlanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-3" />
              <p className="text-muted-foreground">Bu kategoride görev bulunmuyor</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const CategoryIcon = getCategoryIcon(task.category)
              return (
                <div
                  key={task.id}
                  className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getCategoryColor(task.category)}`}
                    >
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{task.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                        </div>
                        <Badge variant={task.status === "completed" ? "default" : "secondary"} className="shrink-0">
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString("tr-TR")}
                        </div>
                        {task.status !== "completed" && (role === "cleaner" || role === "security") && (
                          <Button 
                            size="sm" 
                            className="h-8 rounded-lg"
                            onClick={() => handleCompleteTask(task.id)}
                          >
                            <Camera className="w-3 h-3 mr-1" />
                            Tamamla
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


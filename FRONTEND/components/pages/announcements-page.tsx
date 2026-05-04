"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Megaphone, Plus, Bell, AlertTriangle, Info, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { announcementService } from "@/lib/services/announcement.service"
import type { UserRole, Announcement } from "@/lib/types"

interface AnnouncementsPageProps {
  role: UserRole
}

export function AnnouncementsPage({ role }: AnnouncementsPageProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState<"DUSUK" | "ORTA" | "YUKSEK" | "ACIL">("ORTA")

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    setIsLoading(true)
    
    try {
      // Backend API çağrısı
      const data = await announcementService.getAnnouncements()
      setAnnouncements(data.map(a => ({
        id: a.id,
        title: a.title,
        body: a.content || '',
        priority: a.priority === 'ACIL' ? 'high' : a.priority === 'YUKSEK' ? 'high' : a.priority === 'ORTA' ? 'normal' : 'low',
        createdAt: a.createdAt,
      })))
    } catch (error) {
      // Silently fallback to mock data (backend not running)
      const mockAnnouncements: Announcement[] = [
        {
          id: "1",
          title: "Site Bakım Çalışması",
          body: "Yarın saat 10:00-12:00 arası su kesintisi olacaktır.",
          priority: "high",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Aylık Toplantı",
          body: "Aylık site toplantısı 15 Şubat Cumartesi günü saat 19:00'da yapılacaktır.",
          priority: "normal",
          createdAt: new Date().toISOString(),
        },
      ]
      setAnnouncements(mockAnnouncements)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Backend API çağrısı
      await announcementService.createAnnouncement({
        title,
        content,
        priority,
      })

      toast({
        title: "Başarılı",
        description: "Duyuru oluşturuldu",
      })

      // Reset form
      setTitle("")
      setContent("")
      setPriority("ORTA")
      setIsDialogOpen(false)

      // Reload announcements
      loadAnnouncements()
    } catch (error: any) {
      console.error('Failed to create announcement:', error)
      toast({
        title: "Hata",
        description: "Backend bağlantısı yok. Lütfen backend'i başlatın.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return AlertTriangle
      case "normal":
        return Bell
      case "low":
        return Info
      default:
        return Megaphone
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive"
      case "normal":
        return "bg-primary/10 text-primary"
      case "low":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Acil"
      case "normal":
        return "Normal"
      case "low":
        return "Bilgi"
      default:
        return priority
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Duyurular</h2>
          <p className="text-xs text-muted-foreground">{announcements.length} duyuru</p>
        </div>
        {role === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 rounded-xl">
                <Plus className="w-4 h-4 mr-1" />
                Duyuru Yap
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Duyuru</DialogTitle>
                <DialogDescription>
                  Site sakinlerine duyuru gönderin
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Başlık</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Duyuru başlığı"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">İçerik</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Duyuru içeriği"
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Öncelik</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DUSUK">Bilgi</SelectItem>
                      <SelectItem value="ORTA">Normal</SelectItem>
                      <SelectItem value="YUKSEK">Önemli</SelectItem>
                      <SelectItem value="ACIL">Acil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Oluştur"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Henüz duyuru yok</p>
          </div>
        ) : (
          announcements.map((announcement) => {
            const PriorityIcon = getPriorityIcon(announcement.priority)
            return (
              <div
                key={announcement.id}
                className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getPriorityColor(announcement.priority)}`}
                  >
                    <PriorityIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground">{announcement.title}</p>
                      <Badge variant={announcement.priority === "high" ? "destructive" : "secondary"}>
                        {getPriorityLabel(announcement.priority)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{announcement.body}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(announcement.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}


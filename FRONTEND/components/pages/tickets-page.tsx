"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Plus, Search, CheckCircle2, Wrench, Droplets, Zap, MessageSquare, Loader2, Edit, Clock, Camera, Image as ImageIcon, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ticketService } from "@/lib/services/ticket.service"
import type { UserRole, Ticket } from "@/lib/types"
import Image from "next/image"

interface TicketsPageProps {
  role: UserRole
}

export function TicketsPage({ role }: TicketsPageProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("maintenance")
  const [priority, setPriority] = useState("orta")
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])

  // Manage form state
  const [manageStatus, setManageStatus] = useState("acik")
  const [manageNote, setManageNote] = useState("")
  const [assignedTo, setAssignedTo] = useState("unassigned")

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    setIsLoading(true)
    
    try {
      // Backend API çağrısı
      const data = await ticketService.getTickets()
      setTickets(data.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category || 'other',
        priority: t.priority || 'orta', // Backend'den gelen değeri olduğu gibi kullan
        status: t.status || 'acik', // Backend'den gelen değeri olduğu gibi kullan
        createdAt: t.createdAt,
        apartmentId: '1',
      })))
    } catch (error) {
      // Silently fallback to mock data (backend not running)
      const mockTickets: Ticket[] = [
        {
          id: "1",
          title: "Asansör Arızası",
          description: "B Blok asansörü çalışmıyor",
          category: "maintenance",
          status: "islemde",
          priority: "yuksek",
          createdAt: new Date().toISOString(),
          apartmentId: "1",
        },
        {
          id: "2",
          title: "Su Kaçağı",
          description: "Banyo tavanından su damlıyor",
          category: "plumbing",
          status: "acik",
          priority: "orta",
          createdAt: new Date().toISOString(),
          apartmentId: "1",
        },
        {
          id: "3",
          title: "Kapı Zili Bozuk",
          description: "Daire kapı zili çalışmıyor",
          category: "electrical",
          status: "cozuldu",
          priority: "dusuk",
          createdAt: new Date().toISOString(),
          apartmentId: "1",
        },
      ]
      setTickets(mockTickets)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Backend API çağrısı
      await ticketService.createTicket({
        title,
        description,
        category,
        priority,
      })

      toast({
        title: "Başarılı",
        description: "Arıza bildirimi oluşturuldu",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setCategory("maintenance")
      setPriority("orta")
      setPhotos([])
      setPhotoPreviewUrls([])
      setIsDialogOpen(false)

      // Reload tickets
      loadTickets()
    } catch (error: any) {
      console.error('Failed to create ticket:', error)
      
      // Backend'den gelen hata mesajını göster
      let errorMessage = "Arıza bildirimi oluşturulamadı"
      
      if (error.message) {
        if (error.message.includes("10-2000 karakter")) {
          errorMessage = "Açıklama en az 10 karakter olmalıdır"
        } else if (error.message.includes("3-200 karakter")) {
          errorMessage = "Başlık 3-200 karakter arasında olmalıdır"
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    
    // Max 5 fotoğraf
    if (photos.length + newFiles.length > 5) {
      toast({
        title: "Uyarı",
        description: "En fazla 5 fotoğraf yükleyebilirsiniz",
        variant: "destructive",
      })
      return
    }

    // Her fotoğraf max 5MB
    const oversizedFiles = newFiles.filter(f => f.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast({
        title: "Uyarı",
        description: "Her fotoğraf en fazla 5MB olabilir",
        variant: "destructive",
      })
      return
    }

    // Preview URL'leri oluştur
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file))
    
    setPhotos([...photos, ...newFiles])
    setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls])
  }

  const handleRemovePhoto = (index: number) => {
    // Preview URL'i temizle
    URL.revokeObjectURL(photoPreviewUrls[index])
    
    setPhotos(photos.filter((_, i) => i !== index))
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index))
  }

  const handleManageTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setManageStatus(ticket.status)
    setManageNote("")
    setAssignedTo("unassigned")
    setIsManageDialogOpen(true)
  }

  const handleViewDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsDetailDialogOpen(true)
  }

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return
    
    setIsSubmitting(true)
    try {
      // Backend API çağrısı
      await ticketService.updateTicketStatus(selectedTicket.id, {
        status: manageStatus,
        comment: manageNote || undefined,
      })

      toast({
        title: "Başarılı",
        description: "Arıza durumu güncellendi",
      })

      setIsManageDialogOpen(false)
      setSelectedTicket(null)
      
      // Reload tickets
      loadTickets()
    } catch (error: any) {
      console.error('Failed to update ticket:', error)
      toast({
        title: "Hata",
        description: "Backend bağlantısı yok. Lütfen backend'i başlatın.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredTickets = tickets
    .filter((t) => activeTab === "all" || t.status === activeTab)
    .filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "maintenance":
        return Wrench
      case "plumbing":
        return Droplets
      case "electrical":
        return Zap
      default:
        return AlertTriangle
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "acik":
        return "bg-warning/10 text-warning-foreground"
      case "islemde":
        return "bg-primary/10 text-primary"
      case "kullanici_bekleniyor":
        return "bg-blue/10 text-blue"
      case "cozuldu":
        return "bg-success/10 text-success"
      case "kapali":
        return "bg-muted text-muted-foreground"
      case "reddedildi":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "acik":
        return "Açık"
      case "islemde":
        return "İşlemde"
      case "kullanici_bekleniyor":
        return "Kullanıcı Bekleniyor"
      case "cozuldu":
        return "Çözüldü"
      case "kapali":
        return "Kapatıldı"
      case "reddedildi":
        return "Reddedildi"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "acil":
        return "destructive"
      case "yuksek":
        return "destructive"
      case "orta":
        return "secondary"
      case "dusuk":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "acil":
        return "Acil"
      case "yuksek":
        return "Yüksek"
      case "orta":
        return "Normal"
      case "dusuk":
        return "Düşük"
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
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Arıza Bildirimleri</h2>
          <p className="text-xs text-muted-foreground">{tickets.length} toplam bildirim</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 rounded-xl">
              <Plus className="w-4 h-4 mr-1" />
              Yeni
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Arıza Bildirimi</DialogTitle>
              <DialogDescription>
                Site içindeki arıza ve sorunları bildirin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Arıza başlığı (en az 3 karakter)"
                  minLength={3}
                  maxLength={200}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Arıza detaylarını yazın (en az 10 karakter)"
                  rows={4}
                  minLength={10}
                  maxLength={2000}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/2000 karakter (minimum 10)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Bakım</SelectItem>
                    <SelectItem value="plumbing">Tesisat</SelectItem>
                    <SelectItem value="electrical">Elektrik</SelectItem>
                    <SelectItem value="cleaning">Temizlik</SelectItem>
                    <SelectItem value="security">Güvenlik</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dusuk">Düşük</SelectItem>
                    <SelectItem value="orta">Normal</SelectItem>
                    <SelectItem value="yuksek">Yüksek</SelectItem>
                    <SelectItem value="acil">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2">
                <Label>Fotoğraflar (Opsiyonel)</Label>
                <div className="space-y-3">
                  {/* Photo Preview Grid */}
                  {photoPreviewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {photoPreviewUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Buttons */}
                  {photos.length < 5 && (
                    <div className="flex gap-2">
                      {/* Camera Button */}
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-20 flex-col gap-1"
                        onClick={() => cameraInputRef.current?.click()}
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-xs">Fotoğraf Çek</span>
                      </Button>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />

                      {/* Gallery Button */}
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-20 flex-col gap-1"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-xs">Galeriden Seç</span>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    {photos.length}/5 fotoğraf • Her biri max 5MB
                  </p>
                </div>
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
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Arıza ara..."
          className="pl-10 h-10 rounded-xl bg-muted/50 border-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-10 bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg text-xs">
            Tümü
          </TabsTrigger>
          <TabsTrigger value="acik" className="rounded-lg text-xs">
            Açık
          </TabsTrigger>
          <TabsTrigger value="islemde" className="rounded-lg text-xs">
            İşlemde
          </TabsTrigger>
          <TabsTrigger value="cozuldu" className="rounded-lg text-xs">
            Çözüldü
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-3" />
              <p className="text-muted-foreground">Bu kategoride arıza bulunmuyor</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const CategoryIcon = getCategoryIcon(ticket.category)
              return (
                <div
                  key={ticket.id}
                  className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getStatusColor(ticket.status)}`}
                    >
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ticket.description}</p>
                        </div>
                        <Badge variant={getPriorityColor(ticket.priority) as any} className="shrink-0">
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {getStatusLabel(ticket.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ticket.createdAt).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {role === "admin" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs"
                              onClick={() => handleManageTicket(ticket)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Yönet
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs"
                            onClick={() => handleViewDetail(ticket)}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Detay
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Admin Manage Dialog */}
      {role === "admin" && (
        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Arıza Yönetimi</DialogTitle>
              <DialogDescription>
                Arıza durumunu güncelleyin ve not ekleyin
              </DialogDescription>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                {/* Ticket Info */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">{selectedTicket.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedTicket.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      {getStatusLabel(selectedTicket.status)}
                    </Badge>
                    <Badge variant={getPriorityColor(selectedTicket.priority) as any} className="text-[10px]">
                      {getPriorityLabel(selectedTicket.priority)}
                    </Badge>
                  </div>
                </div>

                {/* Status Update */}
                <div className="space-y-2">
                  <Label htmlFor="status">Durum</Label>
                  <Select value={manageStatus} onValueChange={setManageStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acik">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Açık
                        </div>
                      </SelectItem>
                      <SelectItem value="islemde">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4" />
                          İşlemde
                        </div>
                      </SelectItem>
                      <SelectItem value="kullanici_bekleniyor">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Kullanıcı Bekleniyor
                        </div>
                      </SelectItem>
                      <SelectItem value="cozuldu">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Çözüldü
                        </div>
                      </SelectItem>
                      <SelectItem value="kapali">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Kapatıldı
                        </div>
                      </SelectItem>
                      <SelectItem value="reddedildi">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Reddedildi
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assign To */}
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Atanan Kişi</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Personel seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Atanmadı</SelectItem>
                      <SelectItem value="staff-1">Mehmet Temiz (Temizlik)</SelectItem>
                      <SelectItem value="staff-2">Ali Bakım (Bakım)</SelectItem>
                      <SelectItem value="staff-3">Hasan Güvenli (Güvenlik)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resolution Note */}
                <div className="space-y-2">
                  <Label htmlFor="note">Çözüm Notu / Açıklama</Label>
                  <Textarea
                    id="note"
                    value={manageNote}
                    onChange={(e) => setManageNote(e.target.value)}
                    placeholder="Yapılan işlemler, çözüm detayları..."
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsManageDialogOpen(false)}
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button 
                    onClick={handleUpdateTicket} 
                    disabled={isSubmitting} 
                    className="flex-1"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Güncelle"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Detail Dialog - For all users */}
      {selectedTicket && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Arıza Detayı</DialogTitle>
              <DialogDescription>
                Arıza bildirimi detayları
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Ticket Info */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Başlık</p>
                  <p className="font-medium text-foreground">{selectedTicket.title}</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Açıklama</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedTicket.description}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Badge variant="outline" className="text-[10px]">
                    {getStatusLabel(selectedTicket.status)}
                  </Badge>
                  <Badge variant={getPriorityColor(selectedTicket.priority) as any} className="text-[10px]">
                    {getPriorityLabel(selectedTicket.priority)}
                  </Badge>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Oluşturulma: {new Date(selectedTicket.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setIsDetailDialogOpen(false)}
                className="w-full"
              >
                Kapat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}


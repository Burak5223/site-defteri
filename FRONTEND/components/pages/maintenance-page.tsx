"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wrench, Plus, Calendar, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { maintenanceEquipmentService } from "@/lib/services/maintenance.service"
import type { UserRole } from "@/lib/types"

interface MaintenanceItem {
  id: string
  equipmentName: string
  equipmentType: string
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  maintenanceInterval: number // days
  status: "upcoming" | "due" | "overdue"
  notes?: string
}

interface MaintenancePageProps {
  role: UserRole
}

export function MaintenancePage({ role }: MaintenancePageProps) {
  const [items, setItems] = useState<MaintenanceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Form state
  const [equipmentName, setEquipmentName] = useState("")
  const [equipmentType, setEquipmentType] = useState("elevator")
  const [maintenanceInterval, setMaintenanceInterval] = useState("30")
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState("")

  useEffect(() => {
    loadMaintenanceItems()
  }, [])

  const loadMaintenanceItems = async () => {
    setIsLoading(true)
    
    try {
      // Backend API çağrısı
      const data = await maintenanceEquipmentService.getEquipment()
      setItems(data.map(item => ({
        id: item.id,
        equipmentName: item.equipmentName,
        equipmentType: item.equipmentType,
        lastMaintenanceDate: item.lastMaintenanceDate,
        nextMaintenanceDate: item.nextMaintenanceDate,
        maintenanceInterval: item.maintenanceIntervalDays,
        status: item.status as "upcoming" | "due" | "overdue",
        notes: item.notes,
      })))
    } catch (error) {
      console.error('Failed to load maintenance items:', error)
      // Fallback to empty array on error
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Backend API çağrısı
      await maintenanceEquipmentService.createEquipment({
        equipmentName,
        equipmentType,
        lastMaintenanceDate,
        maintenanceIntervalDays: parseInt(maintenanceInterval),
        notes: notes || undefined,
      })

      toast({
        title: "Başarılı",
        description: "Bakım kaydı oluşturuldu",
      })

      // Reset form
      setEquipmentName("")
      setEquipmentType("elevator")
      setMaintenanceInterval("30")
      setLastMaintenanceDate(new Date().toISOString().split('T')[0])
      setNotes("")
      setIsDialogOpen(false)

      // Reload items
      loadMaintenanceItems()
    } catch (error: any) {
      console.error('Failed to create maintenance item:', error)
      toast({
        title: "Hata",
        description: error.message || "Bakım kaydı oluşturulamadı",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-primary/10 text-primary"
      case "due":
        return "bg-warning/10 text-warning-foreground"
      case "overdue":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Yaklaşıyor"
      case "due":
        return "Zamanı Geldi"
      case "overdue":
        return "Gecikmiş"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return Clock
      case "due":
        return AlertCircle
      case "overdue":
        return AlertCircle
      default:
        return CheckCircle2
    }
  }

  const getEquipmentTypeLabel = (type: string) => {
    switch (type) {
      case "elevator":
        return "Asansör"
      case "generator":
        return "Jeneratör"
      case "boiler":
        return "Kalorifer"
      case "pump":
        return "Pompa"
      case "hvac":
        return "Havalandırma"
      case "other":
        return "Diğer"
      default:
        return type
    }
  }

  const calculateDaysUntil = (date: string) => {
    const today = new Date()
    const targetDate = new Date(date)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
          <h2 className="text-lg font-semibold text-foreground">Bakım Yönetimi</h2>
          <p className="text-xs text-muted-foreground">{items.length} ekipman</p>
        </div>
        {role === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 rounded-xl">
                <Plus className="w-4 h-4 mr-1" />
                Ekipman Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Ekipman</DialogTitle>
                <DialogDescription>
                  Bakım takibi yapılacak ekipman ekleyin
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="equipmentName">Ekipman Adı</Label>
                  <Input
                    id="equipmentName"
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    placeholder="Örn: Ana Bina Asansörü"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipmentType">Ekipman Tipi</Label>
                  <Select value={equipmentType} onValueChange={setEquipmentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elevator">Asansör</SelectItem>
                      <SelectItem value="generator">Jeneratör</SelectItem>
                      <SelectItem value="boiler">Kalorifer</SelectItem>
                      <SelectItem value="pump">Pompa</SelectItem>
                      <SelectItem value="hvac">Havalandırma</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastMaintenanceDate">Son Bakım Tarihi</Label>
                  <Input
                    id="lastMaintenanceDate"
                    type="date"
                    value={lastMaintenanceDate}
                    onChange={(e) => setLastMaintenanceDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenanceInterval">Bakım Periyodu (Gün)</Label>
                  <Select value={maintenanceInterval} onValueChange={setMaintenanceInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 Gün (Aylık)</SelectItem>
                      <SelectItem value="60">60 Gün (2 Aylık)</SelectItem>
                      <SelectItem value="90">90 Gün (3 Aylık)</SelectItem>
                      <SelectItem value="180">180 Gün (6 Aylık)</SelectItem>
                      <SelectItem value="365">365 Gün (Yıllık)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bakım detayları"
                  />
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
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ekle"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Maintenance Items List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Henüz ekipman kaydı yok</p>
          </div>
        ) : (
          items.map((item) => {
            const StatusIcon = getStatusIcon(item.status)
            const daysUntil = calculateDaysUntil(item.nextMaintenanceDate)
            
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getStatusColor(item.status)}`}
                  >
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-foreground">{item.equipmentName}</p>
                        <p className="text-xs text-muted-foreground">{getEquipmentTypeLabel(item.equipmentType)}</p>
                      </div>
                      <Badge variant={item.status === "overdue" ? "destructive" : "secondary"}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Son Bakım</p>
                        <p className="font-medium">
                          {new Date(item.lastMaintenanceDate).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sonraki Bakım</p>
                        <p className="font-medium">
                          {new Date(item.nextMaintenanceDate).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </div>

                    {daysUntil !== null && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {daysUntil > 0 ? (
                            <span>{daysUntil} gün sonra</span>
                          ) : daysUntil === 0 ? (
                            <span className="text-warning-foreground font-medium">Bugün yapılmalı</span>
                          ) : (
                            <span className="text-destructive font-medium">{Math.abs(daysUntil)} gün gecikmiş</span>
                          )}
                        </p>
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">{item.notes}</p>
                    )}
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


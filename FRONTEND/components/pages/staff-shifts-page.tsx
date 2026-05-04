"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogIn,
  LogOut,
  Edit,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { staffShiftService, type StaffShiftResponse } from "@/lib/services/staff-shift.service"
import type { Site } from "@/lib/types"

interface StaffShiftsPageProps {
  currentSite: Site
  role?: "admin" | "staff"
}

const statusConfig = {
  SCHEDULED: { label: "Planlandı", color: "bg-blue-500", icon: Calendar },
  IN_PROGRESS: { label: "Devam Ediyor", color: "bg-yellow-500", icon: Clock },
  COMPLETED: { label: "Tamamlandı", color: "bg-green-500", icon: CheckCircle2 },
  CANCELLED: { label: "İptal", color: "bg-gray-500", icon: XCircle },
  NO_SHOW: { label: "Gelmedi", color: "bg-red-500", icon: AlertCircle },
}

export function StaffShiftsPage({ currentSite, role = "admin" }: StaffShiftsPageProps) {
  const [shifts, setShifts] = useState<StaffShiftResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const { toast } = useToast()

  const [shiftForm, setShiftForm] = useState({
    staffUserId: "",
    shiftDate: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "16:00",
    notes: "",
  })

  const loadShifts = async () => {
    try {
      setIsLoading(true)
      const data = await staffShiftService.getShiftsBySite(currentSite.id, selectedDate)
      setShifts(data)
    } catch (error) {
      console.error("Error loading shifts:", error)
      toast({
        title: "Hata",
        description: "Vardiyalar yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadShifts()
  }, [currentSite.id, selectedDate])

  const handleCreateShift = async () => {
    if (!shiftForm.staffUserId) {
      toast({
        title: "Hata",
        description: "Lütfen personel seçin",
        variant: "destructive",
      })
      return
    }

    try {
      await staffShiftService.createShift(currentSite.id, {
        staffUserId: shiftForm.staffUserId,
        shiftDate: `${shiftForm.shiftDate}T00:00:00`,
        startTime: `${shiftForm.shiftDate}T${shiftForm.startTime}:00`,
        endTime: `${shiftForm.shiftDate}T${shiftForm.endTime}:00`,
        notes: shiftForm.notes || undefined,
      })

      toast({
        title: "Başarılı",
        description: "Vardiya oluşturuldu",
      })

      setShowCreateModal(false)
      setShiftForm({
        staffUserId: "",
        shiftDate: new Date().toISOString().split("T")[0],
        startTime: "08:00",
        endTime: "16:00",
        notes: "",
      })
      loadShifts()
    } catch (error) {
      toast({
        title: "Hata",
        description: "Vardiya oluşturulurken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleCheckIn = async (shiftId: string) => {
    try {
      await staffShiftService.checkIn(currentSite.id, shiftId)
      toast({
        title: "Başarılı",
        description: "Check-in yapıldı",
      })
      loadShifts()
    } catch (error) {
      toast({
        title: "Hata",
        description: "Check-in yapılırken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleCheckOut = async (shiftId: string) => {
    try {
      await staffShiftService.checkOut(currentSite.id, shiftId)
      toast({
        title: "Başarılı",
        description: "Check-out yapıldı",
      })
      loadShifts()
    } catch (error) {
      toast({
        title: "Hata",
        description: "Check-out yapılırken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm("Bu vardiyayı silmek istediğinizden emin misiniz?")) return

    try {
      await staffShiftService.deleteShift(currentSite.id, shiftId)
      toast({
        title: "Başarılı",
        description: "Vardiya silindi",
      })
      loadShifts()
    } catch (error) {
      toast({
        title: "Hata",
        description: "Vardiya silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vardiya Yönetimi</h1>
          <p className="text-sm text-muted-foreground">Personel vardiyalarını yönetin</p>
        </div>
        {role === "admin" && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Vardiya Oluştur
          </Button>
        )}
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="date">Tarih Seç:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shifts List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground mt-2">Yükleniyor...</p>
        </div>
      ) : shifts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Bu tarih için vardiya bulunamadı</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {shifts.map((shift) => {
            const StatusIcon = statusConfig[shift.status].icon
            return (
              <motion.div
                key={shift.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Personel: {shift.staffUserId}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(shift.shiftDate)}
                        </p>
                      </div>
                      <Badge className={statusConfig[shift.status].color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[shift.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Time Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Başlangıç</p>
                        <p className="font-medium">{formatTime(shift.startTime)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bitiş</p>
                        <p className="font-medium">{formatTime(shift.endTime)}</p>
                      </div>
                    </div>

                    {/* Check-in/out Info */}
                    {(shift.checkInTime || shift.checkOutTime) && (
                      <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                        {shift.checkInTime && (
                          <div>
                            <p className="text-muted-foreground">Check-in</p>
                            <p className="font-medium text-green-600">
                              {formatTime(shift.checkInTime)}
                            </p>
                          </div>
                        )}
                        {shift.checkOutTime && (
                          <div>
                            <p className="text-muted-foreground">Check-out</p>
                            <p className="font-medium text-blue-600">
                              {formatTime(shift.checkOutTime)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {shift.notes && (
                      <div className="text-sm border-t pt-3">
                        <p className="text-muted-foreground">Notlar:</p>
                        <p className="mt-1">{shift.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 border-t pt-3">
                      {shift.status === "SCHEDULED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckIn(shift.id)}
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Check-in
                        </Button>
                      )}
                      {shift.status === "IN_PROGRESS" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckOut(shift.id)}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Check-out
                        </Button>
                      )}
                      {role === "admin" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteShift(shift.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Sil
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Shift Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Vardiya Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="staffUserId">Personel ID</Label>
              <Input
                id="staffUserId"
                value={shiftForm.staffUserId}
                onChange={(e) =>
                  setShiftForm({ ...shiftForm, staffUserId: e.target.value })
                }
                placeholder="user-123"
              />
            </div>
            <div>
              <Label htmlFor="shiftDate">Tarih</Label>
              <Input
                id="shiftDate"
                type="date"
                value={shiftForm.shiftDate}
                onChange={(e) =>
                  setShiftForm({ ...shiftForm, shiftDate: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Başlangıç Saati</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) =>
                    setShiftForm({ ...shiftForm, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endTime">Bitiş Saati</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) =>
                    setShiftForm({ ...shiftForm, endTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
              <Textarea
                id="notes"
                value={shiftForm.notes}
                onChange={(e) =>
                  setShiftForm({ ...shiftForm, notes: e.target.value })
                }
                placeholder="Vardiya notları..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateShift} className="flex-1">
                Oluştur
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

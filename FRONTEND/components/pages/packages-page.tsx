"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Package, Plus, Search, CheckCircle2, Truck, QrCode, Camera, Smartphone } from "lucide-react"
import { mockPackages, mockApartments } from "@/lib/mock-data"
import { operationsService } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import type { UserRole, Language } from "@/lib/types"
import { getTranslation } from "@/lib/i18n"

interface PackagesPageProps {
  role: UserRole
  lang?: Language
}

export function PackagesPage({ role, lang = "tr" }: PackagesPageProps) {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false)
  const [deliveryPackage, setDeliveryPackage] = useState<any | null>(null)
  const [packages, setPackages] = useState(mockPackages)
  const [isLoading, setIsLoading] = useState(false)
  const [showAddPackage, setShowAddPackage] = useState(false)
  const [newPackage, setNewPackage] = useState({
    trackingNumber: "",
    courierName: "",
    apartmentId: "",
  })

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    setIsLoading(true)
    try {
      const data = await operationsService.getPackages()
      setPackages(data.map(p => ({
        id: p.id,
        trackingNumber: p.trackingMasked || p.trackingNumber || 'N/A',  // KVKK uyumlu: maskeli numara
        courierName: p.courierName,
        apartmentId: p.apartmentId || '1',
        status: p.status === 'teslim_edildi' ? 'delivered' : 'received',
        receivedAt: p.recordedAt,
        deliveredAt: p.deliveredAt,
      })))
    } catch (error) {
      // Silently fallback to mock data
      console.log('Using mock data for packages')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeliverPackage = async (packageId: string) => {
    try {
      await operationsService.deliverPackage(packageId)
      toast({
        title: "Başarılı",
        description: "Paket teslim edildi",
      })
      setShowDeliveryConfirm(false)
      setDeliveryPackage(null)
      loadPackages()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Paket teslim edilemedi",
        variant: "destructive",
      })
    }
  }

  const handleAddPackage = async () => {
    if (!newPackage.trackingNumber || !newPackage.courierName || !newPackage.apartmentId) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun",
        variant: "destructive",
      })
      return
    }

    try {
      await operationsService.createPackage({
        trackingNumber: newPackage.trackingNumber,
        courierName: newPackage.courierName,
        apartmentId: newPackage.apartmentId,
      })
      toast({
        title: "Başarılı",
        description: "Paket kaydedildi",
      })
      setShowAddPackage(false)
      setNewPackage({ trackingNumber: "", courierName: "", apartmentId: "" })
      loadPackages()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Paket eklenemedi",
        variant: "destructive",
      })
    }
  }

  const filteredPackages = packages
    .filter((p) => activeTab === "all" || p.status === activeTab)
    .filter((p) => p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()))

  const getApartmentInfo = (apartmentId: string) => {
    const apt = mockApartments.find((a) => a.id === apartmentId)
    return apt ? `${apt.blockName} - ${apt.unitNumber}` : "Bilinmeyen"
  }

  const generateQRData = (pkg: any) => {
    return JSON.stringify({
      packageId: pkg.id,
      apartmentId: pkg.apartmentId,
      trackingNumber: pkg.trackingNumber,
      courierName: pkg.courierName,
      timestamp: new Date().toISOString(),
    })
  }

  const handleQuickDeliver = (pkg: any) => {
    setDeliveryPackage(pkg)
    setShowDeliveryConfirm(true)
  }

  const confirmDelivery = () => {
    if (deliveryPackage) {
      handleDeliverPackage(deliveryPackage.id)
    }
  }

  return (
    <div className="p-4 space-y-4 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t("packages_title")}</h2>
          <p className="text-xs text-muted-foreground">
            {mockPackages.filter((p) => p.status === "received").length} {t("packages_waiting").toLowerCase()}
          </p>
        </div>
        {role === "security" && (
          <Button size="sm" className="h-9 rounded-xl" onClick={() => setShowAddPackage(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t("packages_add")}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={`${t("packages_tracking")} ${t("search").toLowerCase()}...`}
          className="pl-10 h-10 rounded-xl bg-muted/50 border-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* QR Actions for Security */}
      {role === "security" && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-12 rounded-xl bg-transparent" onClick={() => setShowQRScanner(true)}>
            <Camera className="w-5 h-5 mr-2" />
            {t("packages_scan_qr")}
          </Button>
          <Button variant="outline" className="h-12 rounded-xl bg-transparent" onClick={() => setShowQRGenerator(true)}>
            <QrCode className="w-5 h-5 mr-2" />
            {t("packages_generate_qr")}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-10 bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg text-xs">
            {t("all")}
          </TabsTrigger>
          <TabsTrigger value="received" className="rounded-lg text-xs">
            {t("packages_waiting")}
          </TabsTrigger>
          <TabsTrigger value="delivered" className="rounded-lg text-xs">
            {t("packages_delivered")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("no_data")}</p>
            </div>
          ) : (
            filteredPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      pkg.status === "received" ? "bg-warning/10 text-warning-foreground" : "bg-success/10 text-success"
                    }`}
                  >
                    {pkg.status === "received" ? <Truck className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{pkg.courierName}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{pkg.trackingNumber}</p>
                      </div>
                      <Badge variant={pkg.status === "received" ? "secondary" : "default"}>
                        {pkg.status === "received" ? t("packages_waiting") : t("packages_delivered")}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {getApartmentInfo(pkg.apartmentId)} •{" "}
                        {new Date(pkg.receivedAt).toLocaleDateString(
                          lang === "tr" ? "tr-TR" : lang === "ar" ? "ar-SA" : lang === "de" ? "de-DE" : "en-US",
                        )}
                      </span>
                      {pkg.status === "received" && role === "security" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg bg-transparent"
                            onClick={() => {
                              setSelectedPackage(pkg.id)
                              setShowQRGenerator(true)
                            }}
                          >
                            <QrCode className="w-3 h-3" />
                          </Button>
                          <Button size="sm" className="h-8 rounded-lg" onClick={() => handleQuickDeliver(pkg)}>
                            {t("packages_quick_deliver")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* QR Scanner Dialog */}
      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("packages_scan_qr")}</DialogTitle>
            <DialogDescription>Paket teslimi için sakinin telefonundaki QR kodu tarayın</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-8">
            <div className="w-64 h-64 bg-muted rounded-2xl flex items-center justify-center border-2 border-dashed border-muted-foreground/30 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-16 h-16 text-muted-foreground/50" />
              </div>
              <motion.div
                className="absolute w-full h-1 bg-primary/50"
                initial={{ top: "10%" }}
                animate={{ top: "90%" }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">Kamerayı QR koda doğru tutun</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQRScanner(false)}>
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Generator Dialog */}
      <Dialog open={showQRGenerator} onOpenChange={setShowQRGenerator}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("packages_generate_qr")}</DialogTitle>
            <DialogDescription>Bu QR kodu sakine gösterin veya mesaj ile gönderin</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="w-48 h-48 bg-white rounded-xl p-4 shadow-lg">
              {/* Simulated QR Code */}
              <div className="w-full h-full bg-gradient-to-br from-foreground via-foreground/90 to-foreground rounded grid grid-cols-8 grid-rows-8 gap-[2px] p-2">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? "bg-white" : "bg-transparent"}`} />
                ))}
              </div>
            </div>
            <p className="text-sm font-mono text-muted-foreground mt-4">
              {selectedPackage ? mockPackages.find((p) => p.id === selectedPackage)?.trackingNumber : "YK123456789"}
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowQRGenerator(false)}>
              {t("cancel")}
            </Button>
            <Button>
              <Smartphone className="w-4 h-4 mr-2" />
              Sakine Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Package Dialog */}
      <Dialog open={showAddPackage} onOpenChange={setShowAddPackage}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Paket Ekle</DialogTitle>
            <DialogDescription>Gelen paketi sisteme kaydedin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tracking">Takip Numarası *</Label>
              <Input
                id="tracking"
                placeholder="YK123456789"
                value={newPackage.trackingNumber}
                onChange={(e) => setNewPackage({ ...newPackage, trackingNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courier">Kargo Firması *</Label>
              <Select
                value={newPackage.courierName}
                onValueChange={(value) => setNewPackage({ ...newPackage, courierName: value })}
              >
                <SelectTrigger id="courier">
                  <SelectValue placeholder="Kargo firması seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yurtiçi Kargo">Yurtiçi Kargo</SelectItem>
                  <SelectItem value="Aras Kargo">Aras Kargo</SelectItem>
                  <SelectItem value="MNG Kargo">MNG Kargo</SelectItem>
                  <SelectItem value="PTT Kargo">PTT Kargo</SelectItem>
                  <SelectItem value="Sürat Kargo">Sürat Kargo</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apartment">Daire *</Label>
              <Select
                value={newPackage.apartmentId}
                onValueChange={(value) => setNewPackage({ ...newPackage, apartmentId: value })}
              >
                <SelectTrigger id="apartment">
                  <SelectValue placeholder="Daire seçin" />
                </SelectTrigger>
                <SelectContent>
                  {mockApartments.map((apt) => (
                    <SelectItem key={apt.id} value={apt.id}>
                      {apt.blockName} - {apt.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddPackage(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleAddPackage}>
              <Plus className="w-4 h-4 mr-2" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Confirmation Dialog */}
      <Dialog open={showDeliveryConfirm} onOpenChange={setShowDeliveryConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Paket Teslimi Onayla</DialogTitle>
            <DialogDescription>Bu paketi teslim etmek istediğinize emin misiniz?</DialogDescription>
          </DialogHeader>
          {deliveryPackage && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t("packages_courier")}:</span>
                    <span className="text-sm font-medium">{deliveryPackage.courierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t("packages_tracking")}:</span>
                    <span className="text-sm font-mono">{deliveryPackage.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Daire:</span>
                    <span className="text-sm font-medium">{getApartmentInfo(deliveryPackage.apartmentId)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDeliveryConfirm(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={confirmDelivery}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Teslim Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


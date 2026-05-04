"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Building2, Users, TrendingUp, Search, ChevronRight, Plus, Settings, BarChart3, 
  Crown, ArrowLeft, User, AlertTriangle, DollarSign, Activity, Clock,
  CheckCircle, XCircle, TrendingDown, Megaphone, FileText, Download, Edit,
  Trash2, Mail, Star, AlertCircle, Zap, Package
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { dashboardService, type DashboardStats } from "@/lib/services/dashboard.service"
import { siteService } from "@/lib/services"
import type { Site } from "@/lib/types"
import type { SiteResponse } from "@/lib/api-types"

interface SuperAdminPageProps {
  sites: Site[]
  onSiteSelect: (site: Site, adminName: string) => void
  onSwitchToAdmin?: () => void
}

export function SuperAdminPage({ sites, onSiteSelect, onSwitchToAdmin }: SuperAdminPageProps) {
  const [activeView, setActiveView] = useState<"dashboard" | "managers" | "reports" | "settings">("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSite, setSelectedSite] = useState<SiteResponse | null>(null)
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)
  const [showBulkAnnouncementModal, setShowBulkAnnouncementModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  
  // Real data from API
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [realSites, setRealSites] = useState<SiteResponse[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingSites, setIsLoadingSites] = useState(true)

  // Load dashboard stats and sites
  useEffect(() => {
    loadDashboardStats()
    loadSites()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setIsLoadingStats(true)
      const stats = await dashboardService.getSuperAdminStats()
      setDashboardStats(stats)
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
      toast({
        title: "Hata",
        description: "Dashboard verileri yüklenemedi",
        variant: "destructive"
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  const loadSites = async () => {
    try {
      setIsLoadingSites(true)
      const sitesData = await siteService.getAllSites()
      // Add default subscriptionStatus if not present
      const sitesWithStatus = sitesData.map(site => ({
        ...site,
        subscriptionStatus: site.subscriptionStatus || 'aktif'
      }))
      setRealSites(sitesWithStatus)
    } catch (error) {
      console.error('Failed to load sites:', error)
      toast({
        title: "Hata",
        description: "Site verileri yüklenemedi",
        variant: "destructive"
      })
    } finally {
      setIsLoadingSites(false)
    }
  }

  const filteredSites = realSites.filter(site => 
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.city?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Site seçiliyse detayını göster
  if (selectedSite) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedSite(null)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{selectedSite.name}</h1>
            <p className="text-sm text-muted-foreground">{selectedSite.city}</p>
          </div>
          <Badge variant={selectedSite.subscriptionStatus === "aktif" ? "default" : "secondary"}>
            {selectedSite.subscriptionStatus === "aktif" ? "Aktif" : "Pasif"}
          </Badge>
        </div>

        {/* Site Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Toplam Daire</span>
                <Building2 className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xl font-bold">{selectedSite.totalApartments || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Toplam Sakin</span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold">{selectedSite.totalResidents || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => onSiteSelect({ 
            id: selectedSite.id, 
            name: selectedSite.name,
            city: selectedSite.city || '',
            address: selectedSite.address || '',
            totalApartments: selectedSite.totalApartments || 0,
            totalResidents: selectedSite.totalResidents || 0
          }, "Site Yöneticisi")}>
            <Building2 className="w-4 h-4 mr-2" />Siteye Git
          </Button>
          <Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-2" />Mesaj Gönder</Button>
          <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2" />Düzenle</Button>
          <Button variant="outline" size="sm" className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Kaldır</Button>
        </div>
      </div>
    )
  }

  // Dashboard View
  if (activeView === "dashboard") {
    return (
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <div>
              <h1 className="text-xl font-bold">Genel Yönetim</h1>
              <p className="text-xs text-muted-foreground">Tüm siteler özeti</p>
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Toplam Site</span>
              </div>
              <p className="text-3xl font-bold text-primary">
                {isLoadingStats ? "..." : dashboardStats?.totalSites || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoadingStats ? "..." : `${dashboardStats?.totalManagers || 0} yönetici`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Toplam Sakin</span>
              </div>
              <p className="text-3xl font-bold text-emerald-500">
                {isLoadingStats ? "..." : dashboardStats?.totalResidents || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoadingStats ? "..." : `${dashboardStats?.totalApartments || 0} daire`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Ortalama Performans</span>
              </div>
              <p className="text-3xl font-bold text-blue-500">
                {isLoadingStats ? "..." : (dashboardStats?.performanceScore || 0).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">5 üzerinden</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Aylık Gelir</span>
              </div>
              <p className="text-3xl font-bold text-amber-500">
                {isLoadingStats ? "..." : `₺${((dashboardStats?.monthlyIncome || 0) / 1000000).toFixed(1)}M`}
              </p>
              <p className={`text-xs mt-1 ${(dashboardStats?.growthRate || 0) >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {isLoadingStats ? "..." : `${(dashboardStats?.growthRate || 0) >= 0 ? '↑' : '↓'} %${Math.abs(dashboardStats?.growthRate || 0).toFixed(1)} ${(dashboardStats?.growthRate || 0) >= 0 ? 'artış' : 'azalış'}`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3 h-3 text-destructive" />
                <span className="text-xs text-muted-foreground">Açık Arızalar</span>
              </div>
              <p className="text-xl font-bold">{isLoadingStats ? "..." : dashboardStats?.openTickets || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-muted-foreground">Bekleyen Aidatlar</span>
              </div>
              <p className="text-xl font-bold">{isLoadingStats ? "..." : dashboardStats?.unpaidDues || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Bekleyen Paketler</span>
              </div>
              <p className="text-xl font-bold">{isLoadingStats ? "..." : dashboardStats?.waitingPackages || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Performans Metrikleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Aidat Tahsilat Oranı</span>
                <span className="text-xs font-medium">{isLoadingStats ? "..." : `${(dashboardStats?.collectionRate || 0).toFixed(1)}%`}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${dashboardStats?.collectionRate || 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Arıza Çözüm Oranı</span>
                <span className="text-xs font-medium">{isLoadingStats ? "..." : `${(dashboardStats?.resolutionRate || 0).toFixed(1)}%`}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${dashboardStats?.resolutionRate || 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Paket Teslimat Oranı</span>
                <span className="text-xs font-medium">{isLoadingStats ? "..." : `${(dashboardStats?.deliveryRate || 0).toFixed(1)}%`}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${dashboardStats?.deliveryRate || 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Hızlı İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddAdminModal(true)}>
              <Plus className="w-4 h-4 mr-2" />Yönetici Ekle
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowBulkAnnouncementModal(true)}>
              <Megaphone className="w-4 h-4 mr-2" />Toplu Duyuru
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowReportModal(true)}>
              <FileText className="w-4 h-4 mr-2" />Rapor Oluştur
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveView("managers")}>
              <Users className="w-4 h-4 mr-2" />Yöneticiler
            </Button>
          </CardContent>
        </Card>

        {/* Alerts - Placeholder for future implementation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Uyarılar ve Bildirimler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              Henüz uyarı bulunmuyor
            </p>
          </CardContent>
        </Card>

        {/* Top Sites by Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              En Aktif Siteler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {realSites.slice(0, 3).map((site, index) => (
              <div key={site.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedSite(site)}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? "bg-amber-500 text-white" :
                  index === 1 ? "bg-gray-400 text-white" :
                  "bg-amber-700 text-white"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{site.name}</p>
                  <p className="text-xs text-muted-foreground">{site.totalApartments} daire</p>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-500" />
                  <span className="text-sm font-bold">{site.totalResidents}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bottom Navigation */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          <Button variant="default" size="sm" onClick={() => setActiveView("dashboard")}>
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveView("managers")}>
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveView("reports")}>
            <FileText className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveView("settings")}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Modals */}
        <Dialog open={showAddAdminModal} onOpenChange={setShowAddAdminModal}>
          <DialogContent className="max-w-sm mx-4 rounded-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Yönetici Ekle</DialogTitle>
              <DialogDescription>Site yöneticisi bilgilerini girin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input placeholder="Örn: Mehmet Yılmaz" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input type="email" placeholder="mehmet@site.com" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input type="tel" placeholder="+90 555 123 4567" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Şifre</Label>
                <Input type="password" placeholder="Güçlü şifre oluşturun" className="rounded-xl" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAddAdminModal(false)}>
                  İptal
                </Button>
                <Button className="flex-1 rounded-xl" onClick={() => setShowAddAdminModal(false)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ekle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkAnnouncementModal} onOpenChange={setShowBulkAnnouncementModal}>
          <DialogContent className="max-w-sm mx-4 rounded-2xl">
            <DialogHeader>
              <DialogTitle>Toplu Duyuru Gönder</DialogTitle>
              <DialogDescription>Tüm sitelere duyuru gönderin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Duyuru Başlığı</Label>
                <Input placeholder="Örn: Önemli Duyuru" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Duyuru İçeriği</Label>
                <Textarea placeholder="Duyuru metnini buraya yazın..." className="rounded-xl min-h-[120px]" />
              </div>
              <div className="space-y-2">
                <Label>Hedef Siteler</Label>
                <Select>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Site seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Siteler</SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Öncelik</Label>
                <Select>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Öncelik seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowBulkAnnouncementModal(false)}>
                  İptal
                </Button>
                <Button className="flex-1 rounded-xl" onClick={() => setShowBulkAnnouncementModal(false)}>
                  <Megaphone className="w-4 h-4 mr-2" />
                  Gönder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
          <DialogContent className="max-w-sm mx-4 rounded-2xl">
            <DialogHeader>
              <DialogTitle>Rapor Oluştur</DialogTitle>
              <DialogDescription>Özel rapor parametrelerini seçin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rapor Tipi</Label>
                <Select>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Rapor tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Finansal Rapor</SelectItem>
                    <SelectItem value="performance">Performans Raporu</SelectItem>
                    <SelectItem value="occupancy">Doluluk Raporu</SelectItem>
                    <SelectItem value="maintenance">Bakım Raporu</SelectItem>
                    <SelectItem value="payment">Ödeme Raporu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zaman Aralığı</Label>
                <Select>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Dönem seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-month">Bu Ay</SelectItem>
                    <SelectItem value="last-month">Geçen Ay</SelectItem>
                    <SelectItem value="this-quarter">Bu Çeyrek</SelectItem>
                    <SelectItem value="this-year">Bu Yıl</SelectItem>
                    <SelectItem value="custom">Özel Tarih</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Site Seçimi</Label>
                <Select>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Site seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Siteler</SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="rounded-xl">
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" className="rounded-xl">
                    <FileText className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowReportModal(false)}>
                  İptal
                </Button>
                <Button className="flex-1 rounded-xl" onClick={() => setShowReportModal(false)}>
                  <Download className="w-4 h-4 mr-2" />
                  Oluştur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Managers View (Sites List)
  if (activeView === "managers") {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Siteler</h1>
          <Button size="sm" onClick={() => setShowAddAdminModal(true)}>
            <Plus className="w-4 h-4 mr-2" />Ekle
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Site ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {isLoadingSites ? (
          <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
        ) : (
          <div className="space-y-2">
            {filteredSites.map((site) => (
              <Card key={site.id} className="overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedSite(site)}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{site.name}</p>
                        <Badge variant={site.subscriptionStatus === "aktif" ? "default" : "secondary"} className="text-xs">
                          {site.subscriptionStatus === "aktif" ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{site.city}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{site.totalApartments || 0} daire</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{site.totalResidents || 0} sakin</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredSites.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Site bulunamadı</div>
            )}
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setActiveView("dashboard")}>
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button variant="default" size="sm" onClick={() => setActiveView("managers")}>
            <Building2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveView("reports")}>
            <FileText className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveView("settings")}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Reports View
  if (activeView === "reports") {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Raporlar</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Finansal Özet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground">Toplam Gelir (Aylık)</p>
                <p className="text-xl font-bold text-emerald-500">
                  {isLoadingStats ? "..." : `₺${((dashboardStats?.monthlyIncome || 0) / 1000000).toFixed(2)}M`}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground">Toplam Gider (Aylık)</p>
                <p className="text-xl font-bold text-destructive">
                  {isLoadingStats ? "..." : `₺${((dashboardStats?.monthlyExpense || 0) / 1000000).toFixed(2)}M`}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-destructive" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
              <div>
                <p className="text-xs text-muted-foreground">Net Bakiye</p>
                <p className="text-xl font-bold text-primary">
                  {isLoadingStats ? "..." : `₺${(((dashboardStats?.monthlyIncome || 0) - (dashboardStats?.monthlyExpense || 0)) / 1000000).toFixed(2)}M`}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Site Karşılaştırması</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingSites ? (
              <div className="text-center py-4 text-muted-foreground">Yükleniyor...</div>
            ) : (
              realSites.slice(0, 5).map((site) => (
                <div key={site.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{site.name}</p>
                    <p className="text-xs text-muted-foreground">{site.totalApartments || 0} daire • {site.totalResidents || 0} sakin</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-500">₺{((site.totalApartments || 0) * 2500).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Tahmini Aylık</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />Excel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />PDF
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setActiveView("dashboard")}>
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveView("managers")}>
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="default" size="sm" onClick={() => setActiveView("reports")}>
            <FileText className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveView("settings")}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Settings View
  if (activeView === "settings") {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Ayarlar</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sistem Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Otomatik Yedekleme</p>
                <p className="text-xs text-muted-foreground">Günlük 03:00</p>
              </div>
              <Badge variant="default">Aktif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">E-posta Bildirimleri</p>
                <p className="text-xs text-muted-foreground">Kritik olaylar</p>
              </div>
              <Badge variant="default">Aktif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">SMS Bildirimleri</p>
                <p className="text-xs text-muted-foreground">Acil durumlar</p>
              </div>
              <Badge variant="secondary">Pasif</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Aktivite Logu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs font-medium">Ahmet Yılmaz - Yeni duyuru ekledi</p>
              <p className="text-xs text-muted-foreground">2 saat önce</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs font-medium">Cevat Kaya - Aidat onayladı</p>
              <p className="text-xs text-muted-foreground">5 saat önce</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs font-medium">Sistem - Otomatik yedekleme tamamlandı</p>
              <p className="text-xs text-muted-foreground">1 gün önce</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-4 gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setActiveView("dashboard")}>
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveView("managers")}>
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveView("reports")}>
            <FileText className="w-4 h-4" />
          </Button>
          <Button variant="default" size="sm" onClick={() => setActiveView("settings")}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return null
}


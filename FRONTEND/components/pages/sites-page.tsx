"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Building2,
  Plus,
  MapPin,
  Users,
  Home,
  Settings,
  MoreVertical,
  Check,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  X,
  UserPlus,
  Mail,
  Phone,
} from "lucide-react"
import type { Site, ResidentInvitation } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

interface SitesPageProps {
  sites: Site[]
  currentSite: Site
  onSiteChange: (site: Site) => void
}

export function SitesPage({ sites, currentSite, onSiteChange }: SitesPageProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [createStep, setCreateStep] = useState(1)
  const [newSiteData, setNewSiteData] = useState({
    name: "",
    address: "",
    city: "",
    country: "Türkiye",
    currency: "TRY",
    timezone: "Europe/Istanbul",
  })
  const [invitations, setInvitations] = useState<ResidentInvitation[]>([])
  const [newInvitation, setNewInvitation] = useState<ResidentInvitation>({
    email: "",
    fullName: "",
    phone: "",
    apartmentNumber: "",
    blockName: "",
    residentType: "owner",
  })

  const totalStats = {
    apartments: sites.reduce((a, b) => a + b.totalApartments, 0),
    residents: sites.reduce((a, b) => a + b.totalResidents, 0),
  }

  const addInvitation = () => {
    if (newInvitation.email && newInvitation.fullName && newInvitation.apartmentNumber) {
      setInvitations([...invitations, newInvitation])
      setNewInvitation({
        email: "",
        fullName: "",
        phone: "",
        apartmentNumber: "",
        blockName: "",
        residentType: "owner",
      })
    }
  }

  const removeInvitation = (index: number) => {
    setInvitations(invitations.filter((_, i) => i !== index))
  }

  const resetCreateModal = () => {
    setShowAddModal(false)
    setCreateStep(1)
    setNewSiteData({
      name: "",
      address: "",
      city: "",
      country: "Türkiye",
      currency: "TRY",
      timezone: "Europe/Istanbul",
    })
    setInvitations([])
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header Stats */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
        <h2 className="text-lg font-semibold">Site Yönetimi</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {sites.length} site • {totalStats.apartments} daire • {totalStats.residents} sakin
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-card border border-border text-center">
          <Building2 className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold">{sites.length}</p>
          <p className="text-xs text-muted-foreground">Site</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border text-center">
          <Home className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
          <p className="text-xl font-bold">{totalStats.apartments}</p>
          <p className="text-xs text-muted-foreground">Daire</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border text-center">
          <Users className="w-5 h-5 mx-auto text-blue-500 mb-1" />
          <p className="text-xl font-bold">{totalStats.residents}</p>
          <p className="text-xs text-muted-foreground">Sakin</p>
        </div>
      </div>

      {/* Sites List */}
      <div className="space-y-3">
        {sites.map((site) => (
          <div
            key={site.id}
            className={`p-4 rounded-2xl border transition-all ${
              currentSite.id === site.id
                ? "bg-primary/5 border-primary/30"
                : "bg-card border-border hover:border-primary/20"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    currentSite.id === site.id ? "bg-primary text-primary-foreground" : "bg-primary/10"
                  }`}
                >
                  <Building2 className={`w-6 h-6 ${currentSite.id !== site.id && "text-primary"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{site.name}</h3>
                    {currentSite.id === site.id && (
                      <Badge variant="default" className="text-[10px] h-5 shrink-0">
                        Aktif
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {site.city}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {site.totalApartments} daire
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {site.totalResidents} sakin
                    </span>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {currentSite.id !== site.id && (
                    <>
                      <DropdownMenuItem onClick={() => onSiteChange(site)}>
                        <Check className="w-4 h-4 mr-2" />
                        Bu Siteye Geç
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setEditingSite(site)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Ayarlar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {currentSite.id !== site.id && (
              <Button
                variant="ghost"
                className="w-full mt-3 h-9 text-primary hover:bg-primary/10 rounded-xl"
                onClick={() => onSiteChange(site)}
              >
                Bu Siteye Geç
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add Site Button */}
      <Button onClick={() => setShowAddModal(true)} className="w-full h-12 rounded-xl" variant="outline">
        <Plus className="w-5 h-5 mr-2" />
        Yeni Site Ekle
      </Button>

      <Dialog open={showAddModal} onOpenChange={resetCreateModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-4 border-b border-border shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>{createStep === 1 ? "Site Bilgileri" : "Sakin Ekle"}</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${createStep >= 1 ? "bg-primary" : "bg-muted"}`} />
                <div className={`w-2 h-2 rounded-full ${createStep >= 2 ? "bg-primary" : "bg-muted"}`} />
              </div>
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {createStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                <div className="space-y-2">
                  <Label>Site Adı</Label>
                  <Input
                    placeholder="Örn: Yeşil Vadi Sitesi"
                    className="rounded-xl"
                    value={newSiteData.name}
                    onChange={(e) => setNewSiteData({ ...newSiteData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adres</Label>
                  <Input
                    placeholder="Tam adres"
                    className="rounded-xl"
                    value={newSiteData.address}
                    onChange={(e) => setNewSiteData({ ...newSiteData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Şehir</Label>
                    <Input
                      placeholder="İstanbul"
                      className="rounded-xl"
                      value={newSiteData.city}
                      onChange={(e) => setNewSiteData({ ...newSiteData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ülke</Label>
                    <Select
                      value={newSiteData.country}
                      onValueChange={(v) => setNewSiteData({ ...newSiteData, country: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Türkiye">Türkiye</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Para Birimi</Label>
                    <Select
                      value={newSiteData.currency}
                      onValueChange={(v) => setNewSiteData({ ...newSiteData, currency: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY (₺)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Zaman Dilimi</Label>
                    <Select
                      value={newSiteData.timezone}
                      onValueChange={(v) => setNewSiteData({ ...newSiteData, timezone: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Istanbul">İstanbul</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {/* Added Invitations List */}
                {invitations.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Eklenecek Sakinler ({invitations.length})</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {invitations.map((inv, index) => (
                        <Card key={index} className="bg-muted/50">
                          <CardContent className="p-2 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{inv.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {inv.blockName} - {inv.apartmentNumber}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => removeInvitation(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Invitation Form */}
                <Card className="border-dashed">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <UserPlus className="w-4 h-4 text-primary" />
                      Yeni Sakin Ekle
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Ad Soyad"
                        className="rounded-xl h-9 text-sm"
                        value={newInvitation.fullName}
                        onChange={(e) => setNewInvitation({ ...newInvitation, fullName: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="E-posta"
                            type="email"
                            className="rounded-xl h-9 text-sm pl-8"
                            value={newInvitation.email}
                            onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                          />
                        </div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Telefon"
                            className="rounded-xl h-9 text-sm pl-8"
                            value={newInvitation.phone}
                            onChange={(e) => setNewInvitation({ ...newInvitation, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Blok (A, B...)"
                          className="rounded-xl h-9 text-sm"
                          value={newInvitation.blockName}
                          onChange={(e) => setNewInvitation({ ...newInvitation, blockName: e.target.value })}
                        />
                        <Input
                          placeholder="Daire No"
                          className="rounded-xl h-9 text-sm"
                          value={newInvitation.apartmentNumber}
                          onChange={(e) => setNewInvitation({ ...newInvitation, apartmentNumber: e.target.value })}
                        />
                      </div>
                      <Select
                        value={newInvitation.residentType}
                        onValueChange={(v: "owner" | "tenant") =>
                          setNewInvitation({ ...newInvitation, residentType: v })
                        }
                      >
                        <SelectTrigger className="rounded-xl h-9 text-sm">
                          <SelectValue placeholder="Sakin Türü" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Kat Maliki</SelectItem>
                          <SelectItem value="tenant">Kiracı</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        className="w-full h-9 rounded-xl text-sm bg-transparent"
                        onClick={addInvitation}
                        disabled={!newInvitation.email || !newInvitation.fullName || !newInvitation.apartmentNumber}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Listeye Ekle
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground text-center">
                  Sakinler e-posta ile davet edilecek. Daha sonra da ekleyebilirsiniz.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="p-4 border-t border-border shrink-0 flex gap-2">
            {createStep === 2 && (
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-11 bg-transparent"
                onClick={() => setCreateStep(1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Geri
              </Button>
            )}
            {createStep === 1 ? (
              <Button
                className="flex-1 rounded-xl h-11"
                onClick={() => setCreateStep(2)}
                disabled={!newSiteData.name || !newSiteData.city}
              >
                Devam
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button className="flex-1 rounded-xl h-11" onClick={resetCreateModal}>
                <Building2 className="w-4 h-4 mr-2" />
                Site Oluştur {invitations.length > 0 && `(${invitations.length} davet)`}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Site Modal */}
      <Dialog open={!!editingSite} onOpenChange={() => setEditingSite(null)}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Site Düzenle</DialogTitle>
          </DialogHeader>
          {editingSite && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Site Adı</Label>
                <Input defaultValue={editingSite.name} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Input defaultValue={editingSite.address} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Şehir</Label>
                  <Input defaultValue={editingSite.city} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Ülke</Label>
                  <Input defaultValue={editingSite.country || "Türkiye"} className="rounded-xl" />
                </div>
              </div>
              <Button className="w-full rounded-xl h-11">Kaydet</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


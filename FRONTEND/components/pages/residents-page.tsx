"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Phone, Mail, Home, Filter, UserPlus, MoreVertical, Building2, Crown, X } from "lucide-react"
import { mockResidents, mockApartments, mockBlocks } from "@/lib/mock-data"
import type { Site } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ResidentsPageProps {
  currentSite: Site
}

export function ResidentsPage({ currentSite }: ResidentsPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "owner" | "tenant">("all")
  const [selectedResident, setSelectedResident] = useState<any | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const siteResidents = mockResidents.filter((r) => r.siteId === currentSite.id)
  const siteBlocks = mockBlocks.filter((b) => b.siteId === currentSite.id)

  const filteredResidents = siteResidents.filter((resident) => {
    const matchesSearch =
      resident.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.phone.includes(searchQuery)

    const matchesFilter = filterType === "all" || resident.residentType === filterType

    return matchesSearch && matchesFilter
  })

  const getApartmentInfo = (apartmentId?: string) => {
    if (!apartmentId) return null
    return mockApartments.find((a) => a.id === apartmentId)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-card border border-border text-center">
          <p className="text-2xl font-bold text-primary">{siteResidents.length}</p>
          <p className="text-xs text-muted-foreground">Toplam Sakin</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border text-center">
          <p className="text-2xl font-bold text-emerald-500">
            {siteResidents.filter((r) => r.residentType === "owner").length}
          </p>
          <p className="text-xs text-muted-foreground">Kat Maliki</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border text-center">
          <p className="text-2xl font-bold text-blue-500">
            {siteResidents.filter((r) => r.residentType === "tenant").length}
          </p>
          <p className="text-xs text-muted-foreground">Kiracı</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Sakin ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0 bg-transparent">
              <Filter className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterType("all")}>Tümü</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("owner")}>Kat Malikleri</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("tenant")}>Kiracılar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={() => setShowAddModal(true)} size="icon" className="h-10 w-10 rounded-xl shrink-0">
          <UserPlus className="w-4 h-4" />
        </Button>
      </div>

      {/* Filter Badge */}
      {filterType !== "all" && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-lg">
            {filterType === "owner" ? "Kat Malikleri" : "Kiracılar"}
            <button onClick={() => setFilterType("all")} className="ml-1">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Residents List */}
      <div className="space-y-2">
        {filteredResidents.map((resident) => {
          const apartment = getApartmentInfo(resident.apartmentId)
          return (
            <div
              key={resident.id}
              className="p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary/10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {resident.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{resident.fullName}</p>
                    {resident.residentType === "owner" && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge
                      variant={resident.residentType === "owner" ? "default" : "secondary"}
                      className="text-[10px] h-5 rounded-md"
                    >
                      {resident.residentType === "owner" ? "Kat Maliki" : "Kiracı"}
                    </Badge>
                    <Badge
                      variant={resident.status === "active" ? "outline" : "secondary"}
                      className="text-[10px] h-5 rounded-md"
                    >
                      {resident.status === "active" ? "Aktif" : resident.status === "pending" ? "Bekliyor" : "Pasif"}
                    </Badge>
                  </div>
                  {apartment && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {apartment.blockName} - Daire {apartment.unitNumber}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedResident(resident)}>Detay Görüntüle</DropdownMenuItem>
                    <DropdownMenuItem>Düzenle</DropdownMenuItem>
                    <DropdownMenuItem>Mesaj Gönder</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Kaldır</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>

      {filteredResidents.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground mt-2">Sakin bulunamadı</p>
        </div>
      )}

      {/* Resident Detail Modal */}
      <Dialog open={!!selectedResident} onOpenChange={() => setSelectedResident(null)}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Sakin Detayı</DialogTitle>
          </DialogHeader>
          {selectedResident && (
            <div className="space-y-4">
              {/* Profile Section */}
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedResident.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{selectedResident.fullName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={selectedResident.residentType === "owner" ? "default" : "secondary"} className="text-xs">
                      {selectedResident.residentType === "owner" ? "Kat Maliki" : "Kiracı"}
                    </Badge>
                    {selectedResident.residentType === "owner" && <Crown className="w-4 h-4 text-amber-500" />}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">İletişim Bilgileri</p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">E-posta</p>
                    <p className="text-sm font-medium truncate">{selectedResident.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <p className="text-sm font-medium">{selectedResident.phone}</p>
                  </div>
                </div>
              </div>

              {/* Apartment Information */}
              {selectedResident.apartmentId && (() => {
                const apartment = getApartmentInfo(selectedResident.apartmentId)
                return apartment ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Daire Bilgileri</p>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Blok</p>
                        <p className="text-sm font-medium">{apartment.blockName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <Home className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Daire No</p>
                        <p className="text-sm font-medium">{apartment.unitNumber}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-muted/50">
                        <p className="text-xs text-muted-foreground">Kat</p>
                        <p className="text-sm font-medium">{apartment.floor}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50">
                        <p className="text-xs text-muted-foreground">Tip</p>
                        <p className="text-sm font-medium">{apartment.type}</p>
                      </div>
                    </div>
                  </div>
                ) : null
              })()}

              {/* Status */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Durum</p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    selectedResident.status === "active" ? "bg-emerald-500" : 
                    selectedResident.status === "pending" ? "bg-amber-500" : "bg-gray-400"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {selectedResident.status === "active" ? "Aktif" : 
                       selectedResident.status === "pending" ? "Onay Bekliyor" : "Pasif"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl bg-transparent">
                  <Phone className="w-4 h-4 mr-2" />
                  Ara
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl bg-transparent">
                  <Mail className="w-4 h-4 mr-2" />
                  Mesaj
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Resident Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Sakin Davet Et</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input placeholder="Örn: Ahmet Yılmaz" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input type="email" placeholder="ornek@email.com" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input type="tel" placeholder="+90 555 123 4567" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Blok</Label>
              <Select>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Blok seçin" />
                </SelectTrigger>
                <SelectContent>
                  {siteBlocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Daire No</Label>
              <Input placeholder="Örn: 12" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Sakin Tipi</Label>
              <Select>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Kat Maliki</SelectItem>
                  <SelectItem value="tenant">Kiracı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full rounded-xl h-11">
              <UserPlus className="w-4 h-4 mr-2" />
              Davet Gönder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


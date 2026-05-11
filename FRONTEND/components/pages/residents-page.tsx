"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Building2, Crown, ArrowLeft, ChevronRight } from "lucide-react"
import { mockResidents, mockApartments, mockBlocks } from "@/lib/mock-data"
import type { Site } from "@/lib/types"

interface ResidentsPageProps {
  currentSite: Site
}

export function ResidentsPage({ currentSite }: ResidentsPageProps) {
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null)
  const [selectedApartment, setSelectedApartment] = useState<any | null>(null)
  const [blocks, setBlocks] = useState<any[]>([])
  const [apartments, setApartments] = useState<any[]>([])
  const [residents, setResidents] = useState<any[]>([])

  const siteResidents = mockResidents.filter((r) => r.siteId === currentSite.id)

  // Load blocks when component mounts
  useEffect(() => {
    loadBlocks()
  }, [currentSite.id])

  // Load apartments when block is selected
  useEffect(() => {
    if (selectedBlock) {
      loadApartments(selectedBlock.id)
    }
  }, [selectedBlock])

  // Load residents when apartment is selected
  useEffect(() => {
    if (selectedApartment) {
      loadResidents(selectedApartment.id)
    }
  }, [selectedApartment])

  const loadBlocks = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/sites/${currentSite.id}/blocks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setBlocks(data)
    } catch (error) {
      console.error('Failed to load blocks:', error)
      toast({
        title: "Hata",
        description: "Bloklar yüklenemedi",
        variant: "destructive"
      })
    }
  }

  const loadApartments = async (blockId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/blocks/${blockId}/apartments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setApartments(data)
    } catch (error) {
      console.error('Failed to load apartments:', error)
      toast({
        title: "Hata",
        description: "Daireler yüklenemedi",
        variant: "destructive"
      })
    }
  }

  const loadResidents = async (apartmentId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/apartments/${apartmentId}/residents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setResidents(data)
    } catch (error) {
      console.error('Failed to load residents:', error)
      toast({
        title: "Hata",
        description: "Sakinler yüklenemedi",
        variant: "destructive"
      })
    }
  }

  const handleBackFromApartment = () => {
    setSelectedApartment(null)
    setResidents([])
  }

  const handleBackFromBlock = () => {
    setSelectedBlock(null)
    setApartments([])
  }

  // Daire seçiliyse sakinleri göster
  if (selectedApartment) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBackFromApartment} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Daire {selectedApartment.unitNumber}</h1>
            <p className="text-sm text-muted-foreground">{selectedBlock?.name} - {currentSite.name}</p>
          </div>
        </div>

        <div className="text-sm font-medium mb-2">Sakinler ({residents.length})</div>

        <div className="space-y-2">
          {residents.map((resident: any) => (
            <Card key={resident.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {resident.fullName?.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{resident.fullName}</p>
                      {resident.residentType === 'owner' && (
                        <Badge variant="default" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Malik
                        </Badge>
                      )}
                      {resident.residentType === 'tenant' && (
                        <Badge variant="secondary" className="text-xs">
                          Kiracı
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{resident.email}</p>
                    <p className="text-sm text-muted-foreground">{resident.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {residents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Bu dairede sakin bulunamadı</div>
          )}
        </div>
      </div>
    )
  }

  // Blok seçiliyse daireleri göster
  if (selectedBlock) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBackFromBlock} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{selectedBlock.name}</h1>
            <p className="text-sm text-muted-foreground">{currentSite.name}</p>
          </div>
        </div>

        <div className="text-sm font-medium mb-2">Daireler ({apartments.length})</div>

        <div className="grid grid-cols-3 gap-2">
          {apartments.map((apartment: any) => (
            <Card 
              key={apartment.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedApartment(apartment)}
            >
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <p className="font-bold text-lg">{apartment.unitNumber}</p>
                <p className="text-xs text-muted-foreground">Kat {apartment.floor}</p>
                {apartment.ownerName && (
                  <p className="text-xs text-muted-foreground mt-1 truncate" title={apartment.ownerName}>
                    {apartment.ownerName}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {apartments.length === 0 && (
            <div className="col-span-3 text-center py-8 text-muted-foreground">Bu blokta daire bulunamadı</div>
          )}
        </div>
      </div>
    )
  }

  // Blokları göster
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Bloklar</h1>
      </div>

      <div className="text-sm font-medium mb-2">Site Blokları ({blocks.length})</div>

      <div className="space-y-2">
        {blocks.map((block: any) => (
          <Card 
            key={block.id} 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setSelectedBlock(block)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{block.name}</p>
                  <p className="text-sm text-muted-foreground">{block.totalApartments || 0} daire</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
        {blocks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Bu sitede blok bulunamadı</div>
        )}
      </div>
    </div>
  )
}

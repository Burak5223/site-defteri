"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Users, Plus, Search, UserCheck, UserX, LogIn, LogOut } from "lucide-react"
import { mockVisitors } from "@/lib/mock-data"
import { operationsService } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import type { UserRole } from "@/lib/types"

interface VisitorsPageProps {
  role: UserRole
}

export function VisitorsPage({ role }: VisitorsPageProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [visitors, setVisitors] = useState(mockVisitors)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadVisitors()
  }, [])

  const loadVisitors = async () => {
    setIsLoading(true)
    try {
      const data = await operationsService.getVisitors()
      setVisitors(data.map(v => ({
        id: v.id,
        name: v.name,
        purpose: v.purpose || 'Ziyaret',
        status: v.status === 'CIKIS_YAPTI' ? 'checked_out' : 'checked_in',
        checkInTime: v.checkInTime,
        checkOutTime: v.checkOutTime,
      })))
    } catch (error) {
      // Silently fallback to mock data
      console.log('Using mock data for visitors')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckOut = async (visitorId: string) => {
    try {
      await operationsService.checkInVisitor(visitorId)
      toast({
        title: "Başarılı",
        description: "Ziyaretçi çıkış yaptı",
      })
      loadVisitors()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Çıkış işlemi başarısız",
        variant: "destructive",
      })
    }
  }

  const filteredVisitors = visitors
    .filter((v) => activeTab === "all" || v.status === activeTab)
    .filter((v) => v.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="p-4 space-y-4 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Ziyaretçi Kayıt</h2>
          <p className="text-xs text-muted-foreground">
            {visitors.filter((v) => v.status === "checked_in").length} aktif ziyaretçi
          </p>
        </div>
        {role === "security" && (
          <Button size="sm" className="h-9 rounded-xl">
            <Plus className="w-4 h-4 mr-1" />
            Kayıt
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Ziyaretçi ara..."
          className="pl-10 h-10 rounded-xl bg-muted/50 border-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-10 bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg text-xs">
            Tümü
          </TabsTrigger>
          <TabsTrigger value="checked_in" className="rounded-lg text-xs">
            Sitede
          </TabsTrigger>
          <TabsTrigger value="checked_out" className="rounded-lg text-xs">
            Çıkış
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Ziyaretçi bulunmuyor</p>
            </div>
          ) : (
            filteredVisitors.map((visitor) => (
              <div
                key={visitor.id}
                className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      visitor.status === "checked_in" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {visitor.status === "checked_in" ? (
                      <UserCheck className="w-5 h-5" />
                    ) : (
                      <UserX className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{visitor.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{visitor.purpose} • Daire A-12</p>
                      </div>
                      <Badge variant={visitor.status === "checked_in" ? "default" : "secondary"}>
                        {visitor.status === "checked_in" ? "Sitede" : "Çıkış"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <LogIn className="w-3 h-3" />
                          {new Date(visitor.checkInTime).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {visitor.checkOutTime && (
                          <span className="flex items-center gap-1">
                            <LogOut className="w-3 h-3" />
                            {new Date(visitor.checkOutTime).toLocaleTimeString("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      {visitor.status === "checked_in" && role === "security" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 rounded-lg bg-transparent"
                          onClick={() => handleCheckOut(visitor.id)}
                        >
                          Çıkış Yap
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


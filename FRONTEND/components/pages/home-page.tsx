"use client"

import { StatCard } from "@/components/stat-card"
import { ListItem } from "@/components/list-item"
import { SectionHeader } from "@/components/section-header"
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Users,
  Building2,
  Megaphone,
  ClipboardList,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import type { UserRole, Site } from "@/lib/types"
import {
  mockTasks,
  mockPackages,
  mockResidents,
} from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useBackendData } from "@/hooks/use-backend-data"

interface HomePageProps {
  role: UserRole
  onNavigate: (tab: string) => void
  currentSite: Site
}

export function HomePage({ role, onNavigate, currentSite }: HomePageProps) {
  const { 
    announcements, 
    dues, 
    tickets, 
    financialSummary, 
    monthlyReports,
    isLoading,
    useBackend 
  } = useBackendData()

  const pendingDues = dues.filter((d) => d.status === "pending" || d.status === "overdue")
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress")
  const pendingTasks = mockTasks.filter((t) => t.status === "pending" || t.status === "in_progress")
  const pendingPackages = mockPackages.filter((p) => p.status === "received")
  const siteResidents = mockResidents.filter((r) => r.siteId === currentSite.id)

  const currentReport = monthlyReports[0]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 stagger-children">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 border border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Hos Geldiniz</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {role === "admin" && `${currentSite.name} yonetim panelinize hos geldiniz.`}
              {role === "resident" && "Bugun sitenizde neler oluyor gorelim."}
              {role === "cleaner" && "Bugunku gorevlerinizi kontrol edin."}
              {role === "security" && "Guvenlik kontrol paneliniz hazir."}
            </p>
          </div>
          {useBackend && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {(role === "admin" || role === "resident") && (
          <>
            <StatCard
              title="Bekleyen Aidat"
              value={pendingDues.length}
              subtitle={
                pendingDues.length > 0
                  ? `₺${pendingDues.reduce((a, b) => a + b.amount, 0).toLocaleString()}`
                  : "Tamamlandi"
              }
              icon={CreditCard}
              variant={pendingDues.some((d) => d.status === "overdue") ? "destructive" : "primary"}
            />
            <StatCard
              title="Acik Ariza"
              value={openTickets.length}
              subtitle={openTickets.length > 0 ? "Islem bekliyor" : "Sorun yok"}
              icon={AlertTriangle}
              variant={openTickets.length > 0 ? "warning" : "success"}
            />
          </>
        )}
        {role === "admin" && (
          <>
            <StatCard title="Toplam Daire" value={currentSite.totalApartments} icon={Building2} variant="default" />
            <StatCard title="Toplam Sakin" value={siteResidents.length} icon={Users} variant="default" />
          </>
        )}
        {(role === "cleaner" || role === "security") && (
          <>
            <StatCard
              title="Bekleyen Gorev"
              value={pendingTasks.filter((t) => t.category === (role === "cleaner" ? "cleaning" : "security")).length}
              subtitle="Bugun tamamlanmali"
              icon={ClipboardList}
              variant="warning"
            />
            <StatCard
              title="Tamamlanan"
              value={mockTasks.filter((t) => t.status === "completed").length}
              subtitle="Bu hafta"
              icon={CheckCircle2}
              variant="success"
            />
          </>
        )}
        {role === "security" && (
          <>
            <StatCard
              title="Bekleyen Paket"
              value={pendingPackages.length}
              subtitle="Teslim edilecek"
              icon={Package}
              variant="primary"
            />
            <StatCard title="Aktif Ziyaretci" value={2} subtitle="Su an sitede" icon={Users} variant="default" />
          </>
        )}
      </div>

      {(role === "admin" || role === "resident") && (
        <section>
          <SectionHeader title="Finansal Ozet" action={{ label: "Detay", onClick: () => onNavigate("finance") }} />
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-3 divide-x divide-border">
                <button
                  onClick={() => onNavigate("finance")}
                  className="p-3 text-center hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] text-muted-foreground">Gelir</span>
                  </div>
                  <p className="text-sm font-bold text-emerald-500">{formatCurrency(currentReport.income)}</p>
                </button>
                <button
                  onClick={() => onNavigate("finance")}
                  className="p-3 text-center hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingDown className="w-3 h-3 text-rose-500" />
                    <span className="text-[10px] text-muted-foreground">Gider</span>
                  </div>
                  <p className="text-sm font-bold text-rose-500">{formatCurrency(currentReport.expense)}</p>
                </button>
                <button
                  onClick={() => onNavigate("finance")}
                  className="p-3 text-center hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Wallet className={`w-3 h-3 ${currentReport.balance >= 0 ? "text-primary" : "text-amber-500"}`} />
                    <span className="text-[10px] text-muted-foreground">Bakiye</span>
                  </div>
                  <p className={`text-sm font-bold ${currentReport.balance >= 0 ? "text-primary" : "text-amber-500"}`}>
                    {formatCurrency(currentReport.balance)}
                  </p>
                </button>
              </div>
              <div className="px-3 py-2 bg-muted/30 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Aidat Tahsilat</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-medium">
                      {formatCurrency(financialSummary.duesCollected)}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(
                        financialSummary.duesCollected +
                          financialSummary.duesPending +
                          financialSummary.duesOverdue,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {role === "admin" && (
        <section>
          <SectionHeader title="Hizli Islemler" />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-auto py-3 px-4 rounded-xl justify-start bg-transparent"
              onClick={() => onNavigate("residents")}
            >
              <Users className="w-5 h-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Sakinler</p>
                <p className="text-xs text-muted-foreground">{siteResidents.length} kisi</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 px-4 rounded-xl justify-start bg-transparent"
              onClick={() => onNavigate("sites")}
            >
              <Building2 className="w-5 h-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Siteler</p>
                <p className="text-xs text-muted-foreground">Yonet</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 px-4 rounded-xl justify-start bg-transparent"
              onClick={() => onNavigate("finance")}
            >
              <Wallet className="w-5 h-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Finans</p>
                <p className="text-xs text-muted-foreground">Gelir/Gider</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 px-4 rounded-xl justify-start bg-transparent"
              onClick={() => onNavigate("dues")}
            >
              <CreditCard className="w-5 h-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Aidatlar</p>
                <p className="text-xs text-muted-foreground">Takip et</p>
              </div>
            </Button>
          </div>
        </section>
      )}

      {/* Recent Announcements */}
      <section>
        <SectionHeader title="Son Duyurular" action={{ label: "Tumu", onClick: () => onNavigate("announcements") }} />
        <div className="space-y-2">
          {announcements.slice(0, 2).map((announcement) => (
            <div
              key={announcement.id}
              className="p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary shrink-0" />
                  <p className="font-medium text-sm text-foreground">{announcement.title}</p>
                </div>
                {announcement.priority === "high" && (
                  <Badge variant="destructive" className="text-[10px] shrink-0">
                    Onemli
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 ml-6">{announcement.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions based on role */}
      {(role === "admin" || role === "resident") && openTickets.length > 0 && (
        <section>
          <SectionHeader title="Aktif Arizalar" action={{ label: "Tumu", onClick: () => onNavigate("tickets") }} />
          <div className="space-y-2">
            {openTickets.slice(0, 2).map((ticket) => (
              <ListItem
                key={ticket.id}
                title={ticket.title}
                subtitle={ticket.description}
                icon={AlertTriangle}
                iconBg={
                  ticket.priority === "high"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10 text-warning-foreground"
                }
                badge={{
                  label: ticket.status === "in_progress" ? "Islemde" : "Acik",
                  variant: ticket.status === "in_progress" ? "secondary" : "outline",
                }}
                onClick={() => onNavigate("tickets")}
              />
            ))}
          </div>
        </section>
      )}

      {(role === "cleaner" || role === "security" || role === "admin") && pendingTasks.length > 0 && (
        <section>
          <SectionHeader title="Bugunku Gorevler" action={{ label: "Tumu", onClick: () => onNavigate("tasks") }} />
          <div className="space-y-2">
            {pendingTasks
              .filter((t) => role === "admin" || t.category === (role === "cleaner" ? "cleaning" : "security"))
              .slice(0, 3)
              .map((task) => (
                <ListItem
                  key={task.id}
                  title={task.title}
                  subtitle={task.description}
                  icon={task.status === "in_progress" ? Clock : ClipboardList}
                  iconBg={
                    task.status === "in_progress" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }
                  badge={{
                    label: task.status === "in_progress" ? "Devam Ediyor" : "Bekliyor",
                    variant: task.status === "in_progress" ? "default" : "secondary",
                  }}
                  onClick={() => onNavigate("tasks")}
                />
              ))}
          </div>
        </section>
      )}
    </div>
  )
}


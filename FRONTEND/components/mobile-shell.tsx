"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Home,
  CreditCard,
  AlertTriangle,
  Bell,
  User,
  Package,
  Users,
  ClipboardList,
  Settings,
  Vote,
  Megaphone,
  Shield,
  Sparkles,
  Menu,
  X,
  Building2,
  ChevronDown,
  ChevronLeft,
  Plus,
  Wallet,
  MessageCircle,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { UserRole, Site } from "@/lib/types"
import type { Language } from "@/lib/i18n"
import { getTranslation, isRTL } from "@/lib/i18n"

interface NavItem {
  id: string
  labelKey: string
  icon: React.ElementType
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { id: "home", labelKey: "home", icon: Home, roles: ["super_admin", "admin", "resident", "cleaner", "security"] },
  { id: "residents", labelKey: "residents_title", icon: Users, roles: ["admin"] },
  { id: "sites", labelKey: "sites_title", icon: Building2, roles: ["admin"] },
  { id: "finance", labelKey: "finance_title", icon: Wallet, roles: ["admin", "resident"] },
  { id: "dues", labelKey: "dues_title", icon: CreditCard, roles: ["admin", "resident"] },
  { id: "tickets", labelKey: "home_open_tickets", icon: AlertTriangle, roles: ["admin", "resident"] },
  { id: "maintenance", labelKey: "maintenance_title", icon: Wrench, roles: ["admin", "resident"] },
  { id: "tasks", labelKey: "tasks_title", icon: ClipboardList, roles: ["admin", "cleaner", "security"] },
  { id: "packages", labelKey: "packages_title", icon: Package, roles: ["admin", "security", "resident"] },
  {
    id: "messages",
    labelKey: "messages_title",
    icon: MessageCircle,
    roles: ["super_admin", "admin", "resident", "cleaner", "security"],
  },
  {
    id: "announcements",
    labelKey: "announcements_title",
    icon: Megaphone,
    roles: ["admin", "resident", "cleaner", "security"],
  },
  { id: "voting", labelKey: "home_today_tasks", icon: Vote, roles: ["admin", "resident"] },
  { id: "profile", labelKey: "profile_title", icon: User, roles: ["super_admin", "admin", "resident", "cleaner", "security"] },
]

const getBottomNavItems = (role: UserRole): string[] => {
  switch (role) {
    case "super_admin":
      return ["home", "sites", "messages", "profile"]
    case "admin":
      return ["home", "messages", "tasks", "packages"]
    case "resident":
      return ["home", "messages", "dues", "tickets"]
    case "security":
      return ["home", "messages", "packages", "tasks"]
    case "cleaner":
      return ["home", "messages", "tasks", "announcements"]
    default:
      return ["home", "messages", "profile", "announcements"]
  }
}

interface MobileShellProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  role: UserRole
  notificationCount?: number
  messageCount?: number
  currentSite: Site
  sites: Site[]
  onSiteChange: (site: Site) => void
  lang?: Language
  currentAdminName?: string
  onBackToSuperAdmin?: () => void
}

export function MobileShell({
  children,
  activeTab,
  onTabChange,
  role,
  notificationCount = 0,
  messageCount = 0,
  currentSite,
  sites,
  onSiteChange,
  lang = "tr",
  currentAdminName,
  onBackToSuperAdmin,
}: MobileShellProps) {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)
  const rtl = isRTL(lang)

  const [menuOpen, setMenuOpen] = useState(false)
  const [siteSelectorOpen, setSiteSelectorOpen] = useState(false)

  // Super admin bir siteye girdiğinde admin menüsünü göster
  const effectiveRole = role === "super_admin" && !onBackToSuperAdmin ? "super_admin" : role === "super_admin" ? "admin" : role

  const filteredNavItems = navItems.filter((item) => item.roles.includes(effectiveRole))

  const bottomNavIds = getBottomNavItems(effectiveRole)
  const bottomNavItems = bottomNavIds
    .map((id) => filteredNavItems.find((item) => item.id === id))
    .filter(Boolean) as typeof navItems

  const moreNavItems = filteredNavItems.filter((item) => !bottomNavIds.includes(item.id))

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case "super_admin":
        return "Genel Yönetici"
      case "admin":
        return t("role_admin")
      case "resident":
        return t("role_resident")
      case "cleaner":
        return t("role_cleaner")
      case "security":
        return t("role_security")
    }
  }

  const getRoleIcon = (r: UserRole) => {
    switch (r) {
      case "super_admin":
        return Shield
      case "admin":
        return Settings
      case "resident":
        return Home
      case "cleaner":
        return Sparkles
      case "security":
        return Shield
    }
  }

  const getNavLabel = (item: NavItem) => {
    return t(item.labelKey as Parameters<typeof getTranslation>[1])
  }

  const RoleIcon = getRoleIcon(role)

  return (
    <div className={cn("min-h-screen bg-background flex flex-col max-w-md mx-auto relative", rtl && "rtl")}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToSuperAdmin && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onBackToSuperAdmin}
                className="shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <RoleIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              {role === "admin" && sites.length > 1 ? (
                <button
                  onClick={() => setSiteSelectorOpen(true)}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <h1 className="text-base font-semibold text-foreground">{currentSite.name}</h1>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              ) : (
                <h1 className="text-base font-semibold text-foreground">{currentSite.name}</h1>
              )}
              <p className="text-xs text-muted-foreground">
                {currentAdminName ? `${currentAdminName} - ${getRoleLabel(role)}` : getRoleLabel(role)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card/95 backdrop-blur-xl border-t border-border px-2 py-2 z-40">
        <div className="flex items-center justify-around">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const showBadge = item.id === "messages" && messageCount > 0
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[60px] relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{getNavLabel(item)}</span>
                {showBadge && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                    {messageCount}
                  </span>
                )}
              </button>
            )
          })}
          {moreNavItems.length > 0 && (
            <button
              onClick={() => setMenuOpen(true)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted min-w-[60px]"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">
                {lang === "tr" ? "Daha" : lang === "en" ? "More" : lang === "de" ? "Ещё" : "المزيد"}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Slide-over Menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className={cn(
              "fixed top-0 bottom-0 w-72 bg-card border-l border-border z-50 animate-in duration-300",
              rtl ? "left-0 slide-in-from-left border-r border-l-0" : "right-0 slide-in-from-right",
            )}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">
                {lang === "tr" ? "Menü" : lang === "en" ? "Menu" : lang === "de" ? "Меню" : "القائمة"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-2 space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                const showBadge = item.id === "messages" && messageCount > 0
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id)
                      setMenuOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium flex-1 text-left">{getNavLabel(item)}</span>
                    {showBadge && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {messageCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Site Selector Modal */}
      {siteSelectorOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setSiteSelectorOpen(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-card border border-border rounded-2xl z-50 animate-in zoom-in-95 duration-200 shadow-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">{t("sites_switch")}</h2>
              <Button variant="ghost" size="icon" onClick={() => setSiteSelectorOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
              {sites.map((site) => (
                <button
                  key={site.id}
                  onClick={() => {
                    onSiteChange(site)
                    setSiteSelectorOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                    currentSite.id === site.id ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2
                      className={cn("w-5 h-5", currentSite.id === site.id ? "text-primary-foreground" : "text-primary")}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{site.name}</p>
                    <p
                      className={cn(
                        "text-xs truncate",
                        currentSite.id === site.id ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {site.city} • {site.totalApartments}{" "}
                      {lang === "tr" ? "daire" : lang === "en" ? "apartments" : lang === "de" ? "квартир" : "شقة"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-border">
              <button
                onClick={() => {
                  setSiteSelectorOpen(false)
                  onTabChange("sites")
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-primary hover:bg-primary/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">{t("sites_add")}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


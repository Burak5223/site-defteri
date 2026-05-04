"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Mail,
  Phone,
  Building2,
  Home,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Globe,
  Check,
} from "lucide-react"
import { mockUser, mockSite, mockApartment } from "@/lib/mock-data"
import type { UserRole, Language } from "@/lib/types"
import { getTranslation, languageNames, languageFlags, isRTL } from "@/lib/i18n"
import { NotificationSettingsPage } from "./notification-settings-page"

interface ProfilePageProps {
  role: UserRole
  onRoleChange: (role: UserRole) => void
  onLogout?: () => void
  lang?: Language
  onLangChange?: (lang: Language) => void
}

export function ProfilePage({ role, onRoleChange, onLogout, lang = "tr", onLangChange }: ProfilePageProps) {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)
  const [showLanguageDialog, setShowLanguageDialog] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)

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

  const languages: Language[] = ["tr", "en", "de", "ar"]

  if (showNotificationSettings) {
    return <NotificationSettingsPage lang={lang} onBack={() => setShowNotificationSettings(false)} />
  }

  return (
    <div className={`p-4 space-y-6 stagger-children ${isRTL(lang) ? "rtl" : ""}`}>
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <Avatar className="w-24 h-24 border-4 border-primary/20">
          <AvatarImage src={mockUser.avatar || "/placeholder.svg"} alt={mockUser.fullName} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {role === "super_admin" ? "SA" : mockUser.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold mt-4">
          {role === "super_admin" ? "Sistem Yöneticisi" : mockUser.fullName}
        </h2>
        <Badge variant="secondary" className="mt-2">
          {getRoleLabel(role)}
        </Badge>
        {role === "super_admin" && (
          <p className="text-xs text-muted-foreground mt-2">Tüm sitelere tam erişim</p>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">{t("login_email")}</p>
            <p className="text-sm font-medium">
              {role === "super_admin" ? "superadmin@site.com" : mockUser.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
          <Phone className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Telefon</p>
            <p className="text-sm font-medium">
              {role === "super_admin" ? "+90 555 000 0000" : mockUser.phone}
            </p>
          </div>
        </div>
        {role === "super_admin" ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Yetki Seviyesi</p>
              <p className="text-sm font-medium">Tam Yetki - Tüm Siteler</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("sites_title")}</p>
              <p className="text-sm font-medium">{mockSite.name}</p>
            </div>
          </div>
        )}
        {(role === "resident" || role === "admin") && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <Home className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Daire</p>
              <p className="text-sm font-medium">
                {mockApartment.blockName} - {mockApartment.unitNumber}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Settings Menu */}
      <div className="space-y-2">
        <button
          onClick={() => setShowNotificationSettings(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">{t("profile_notification_settings")}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => setShowLanguageDialog(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">{t("profile_language")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {languageFlags[lang]} {languageNames[lang]}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>

        <button className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">{t("profile_privacy")}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <button className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">{t("profile_help")}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
        onClick={onLogout}
      >
        <LogOut className="w-5 h-5 mr-2" />
        {t("logout")}
      </Button>

      {/* Language Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("profile_language")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => {
                  onLangChange?.(l)
                  setShowLanguageDialog(false)
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  lang === l ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{languageFlags[l]}</span>
                  <span className="font-medium">{languageNames[l]}</span>
                </div>
                {lang === l && <Check className="w-5 h-5 text-primary" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


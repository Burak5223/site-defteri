"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  BellRing,
  Mail,
  Smartphone,
  CreditCard,
  Package,
  Megaphone,
  Wrench,
  ChevronLeft,
  Clock,
  Check,
} from "lucide-react"
import type { Language, PushNotificationSettings } from "@/lib/types"
import { getTranslation } from "@/lib/i18n"

interface NotificationSettingsPageProps {
  lang?: Language
  onBack?: () => void
}

export function NotificationSettingsPage({ lang = "tr", onBack }: NotificationSettingsPageProps) {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)

  const [settings, setSettings] = useState<PushNotificationSettings>({
    enabled: true,
    duesReminder: true,
    packageAlert: true,
    announcementAlert: true,
    maintenanceAlert: false,
    daysBeforeDueReminder: 7,
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const notificationTypes = [
    {
      key: "duesReminder" as const,
      icon: CreditCard,
      title: t("notifications_dues_reminder"),
      description: "Aidat son ödeme tarihinden önce hatırlatma",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      key: "packageAlert" as const,
      icon: Package,
      title: t("notifications_package_alert"),
      description: "Yeni paket geldiğinde bildirim",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      key: "announcementAlert" as const,
      icon: Megaphone,
      title: t("notifications_announcement"),
      description: "Yeni duyuru yayınlandığında bildirim",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      key: "maintenanceAlert" as const,
      icon: Wrench,
      title: t("notifications_maintenance"),
      description: "Bakım ve onarım bildirimleri",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ]

  return (
    <div className="p-4 space-y-6 stagger-children">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h2 className="text-lg font-semibold">{t("notifications_settings")}</h2>
          <p className="text-xs text-muted-foreground">Bildirim tercihlerinizi yönetin</p>
        </div>
      </div>

      {/* Master Toggle */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
              >
                {settings.enabled ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-medium">{t("notifications_push")}</p>
                <p className="text-xs text-muted-foreground">
                  {settings.enabled ? t("notifications_enable") : t("notifications_disable")}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Bildirim Türleri</h3>
        {notificationTypes.map((type) => {
          const Icon = type.icon
          return (
            <motion.div key={type.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={!settings.enabled ? "opacity-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${type.bgColor} ${type.color}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{type.title}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                    <Switch
                      disabled={!settings.enabled}
                      checked={settings[type.key]}
                      onCheckedChange={(checked) => setSettings({ ...settings, [type.key]: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Auto Reminder Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            {t("auto_reminder_title")}
          </CardTitle>
          <CardDescription className="text-xs">
            Aidat son ödeme tarihinden kaç gün önce hatırlatma yapılsın?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t("auto_reminder_dues")}</span>
            <Badge variant="secondary" className="font-mono">
              {settings.daysBeforeDueReminder} {t("auto_reminder_days_before")}
            </Badge>
          </div>
          <Slider
            disabled={!settings.enabled || !settings.duesReminder}
            value={[settings.daysBeforeDueReminder]}
            onValueChange={([value]) => setSettings({ ...settings, daysBeforeDueReminder: value })}
            min={1}
            max={14}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 gün</span>
            <span>7 gün</span>
            <span>14 gün</span>
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Bildirim Kanalları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">{t("notifications_push")}</span>
            </div>
            <Badge variant="default" className="text-[10px]">
              Aktif
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">{t("notifications_email")}</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Yakında
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button className="w-full h-12 rounded-xl" onClick={handleSave}>
        {saved ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            {t("success")}
          </>
        ) : (
          t("save")
        )}
      </Button>
    </div>
  )
}


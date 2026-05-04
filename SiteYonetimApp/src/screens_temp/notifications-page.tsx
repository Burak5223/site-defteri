"use client"

import { Button } from "@/components/ui/button"
import { Bell, CheckCircle2, AlertTriangle, Info, Check } from "lucide-react"
import { mockNotifications } from "@/lib/mock-data"
import type { UserRole } from "@/lib/types"

interface NotificationsPageProps {
  role: UserRole
}

export function NotificationsPage({ role }: NotificationsPageProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return CheckCircle2
      case "warning":
        return AlertTriangle
      case "error":
        return AlertTriangle
      case "info":
        return Info
      default:
        return Bell
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-success/10 text-success"
      case "warning":
        return "bg-warning/10 text-warning-foreground"
      case "error":
        return "bg-destructive/10 text-destructive"
      case "info":
        return "bg-primary/10 text-primary"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const unreadCount = mockNotifications.filter((n) => !n.read).length

  return (
    <div className="p-4 space-y-4 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Bildirimler</h2>
          <p className="text-xs text-muted-foreground">{unreadCount} okunmamış bildirim</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            <Check className="w-3 h-3 mr-1" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {mockNotifications.map((notification) => {
          const TypeIcon = getTypeIcon(notification.type)
          return (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border transition-all ${
                notification.read ? "bg-card border-border" : "bg-primary/5 border-primary/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getTypeColor(notification.type)}`}
                >
                  <TypeIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${notification.read ? "text-foreground" : "text-foreground"}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    {!notification.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notification.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {mockNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Bildirim bulunmuyor</p>
        </div>
      )}
    </div>
  )
}


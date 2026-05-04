"use client"

import { useState } from "react"
import { MobileShell } from "@/components/mobile-shell"
import { HomePage } from "@/components/pages/home-page"
import { SuperAdminPage } from "@/components/pages/super-admin-page"
import { SuperAdminMessagesPage } from "@/components/pages/super-admin-messages-page"
import { DuesPage } from "@/components/pages/dues-page"
import { TicketsPage } from "@/components/pages/tickets-page"
import { TasksPage } from "@/components/pages/tasks-page"
import { MaintenancePage } from "@/components/pages/maintenance-page"
import { PackagesPage } from "@/components/pages/packages-page"
import { AnnouncementsPage } from "@/components/pages/announcements-page"
import { NotificationsPage } from "@/components/pages/notifications-page"
import { ProfilePage } from "@/components/pages/profile-page"
import { ResidentsPage } from "@/components/pages/residents-page"
import { SitesPage } from "@/components/pages/sites-page"
import { FinancePage } from "@/components/pages/finance-page"
import { MessagesPage } from "@/components/pages/messages-page"
import { VotingPage } from "@/components/pages/voting-page"
import { NotificationSettingsPage } from "@/components/pages/notification-settings-page"
import { LoginPage } from "@/components/pages/login-page"
import type { UserRole, Site } from "@/lib/types"
import { mockSites } from "@/lib/mock-data"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [role, setRole] = useState<UserRole>("resident")
  const [currentSite, setCurrentSite] = useState<Site>(mockSites[0])
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(true) // Super admin starts in overview mode
  const [currentAdminName, setCurrentAdminName] = useState<string>("") // Hangi admin'in hesabında olduğumuzu takip eder

  const handleLogin = (userRole: UserRole) => {
    setRole(userRole)
    setIsAuthenticated(true)
    if (userRole === "super_admin") {
      setIsSuperAdminMode(true)
      setActiveTab("home")
    }
  }

  const handleSiteSelect = (site: Site, adminName: string) => {
    setCurrentSite(site)
    setCurrentAdminName(adminName)
    setIsSuperAdminMode(false)
    setActiveTab("home")
  }

  const handleSwitchToSuperAdmin = () => {
    setIsSuperAdminMode(true)
    setCurrentAdminName("")
    setActiveTab("home")
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  const renderPage = () => {
    // Super Admin Overview Mode
    if (role === "super_admin" && isSuperAdminMode) {
      if (activeTab === "messages") {
        return <SuperAdminMessagesPage />
      }
      if (activeTab === "profile") {
        return <ProfilePage role={role} onRoleChange={(newRole) => {
          setRole(newRole)
          if (newRole === "super_admin") {
            setIsSuperAdminMode(true)
            setActiveTab("home")
          } else {
            setIsSuperAdminMode(false)
          }
        }} />
      }
      // Home or sites tab - show manager list
      return (
        <SuperAdminPage 
          sites={mockSites} 
          onSiteSelect={handleSiteSelect}
          onSwitchToAdmin={() => setIsSuperAdminMode(false)}
        />
      )
    }

    // Super admin bir siteye girdiğinde admin olarak görüntüle
    const effectiveRole = role === "super_admin" ? "admin" : role

    // Normal page routing
    switch (activeTab) {
      case "home":
        return <HomePage role={effectiveRole} onNavigate={setActiveTab} currentSite={currentSite} />
      case "dues":
        return <DuesPage role={effectiveRole} />
      case "tickets":
        return <TicketsPage role={effectiveRole} />
      case "tasks":
        return <TasksPage role={effectiveRole} />
      case "maintenance":
        return <MaintenancePage role={effectiveRole} />
      case "packages":
        return <PackagesPage role={effectiveRole} />
      case "announcements":
        return <AnnouncementsPage role={effectiveRole} />
      case "notifications":
        return <NotificationsPage role={effectiveRole} />
      case "profile":
        return <ProfilePage role={role} onRoleChange={(newRole) => {
          setRole(newRole)
          if (newRole === "super_admin") {
            setIsSuperAdminMode(true)
            setActiveTab("home")
          } else {
            setIsSuperAdminMode(false)
          }
        }} />
      case "residents":
        return <ResidentsPage currentSite={currentSite} />
      case "sites":
        return <SitesPage sites={mockSites} currentSite={currentSite} onSiteChange={setCurrentSite} />
      case "finance":
        return <FinancePage currentSite={currentSite} role={effectiveRole} />
      case "messages":
        return <MessagesPage role={effectiveRole} userId="user-1" currentSite={currentSite} />
      case "voting":
        return <VotingPage role={effectiveRole} />
      case "notification-settings":
        return <NotificationSettingsPage />
      default:
        return <HomePage role={effectiveRole} onNavigate={setActiveTab} currentSite={currentSite} />
    }
  }

  return (
    <MobileShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      role={role}
      notificationCount={3}
      messageCount={2}
      currentSite={currentSite}
      sites={mockSites}
      onSiteChange={setCurrentSite}
      currentAdminName={currentAdminName}
      onBackToSuperAdmin={role === "super_admin" && !isSuperAdminMode ? handleSwitchToSuperAdmin : undefined}
    >
      {renderPage()}
    </MobileShell>
  )
}


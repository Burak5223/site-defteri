"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { UserRole } from "@/lib/types"
import type { Language } from "@/lib/i18n"
import { getTranslation, languageNames, languageFlags, isRTL } from "@/lib/i18n"
import { authService } from "@/lib/services/auth.service"

interface LoginPageProps {
  onLogin: (role: UserRole) => void
  lang?: Language
  onLangChange?: (lang: Language) => void
}

export function LoginPage({ onLogin, lang = "tr", onLangChange }: LoginPageProps) {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const languages: Language[] = ["tr", "en", "de", "ar"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Try backend login first
      const response = await authService.login({
        email,
        password,
      })

      // Determine role from backend response
      let userRole: UserRole = "resident"
      if (response.roles.includes("ROLE_SUPER_ADMIN")) {
        userRole = "super_admin"
      } else if (response.roles.includes("ROLE_ADMIN")) {
        userRole = "admin"
      } else if (response.roles.includes("ROLE_SECURITY")) {
        userRole = "security"
      } else if (response.roles.includes("ROLE_CLEANER")) {
        userRole = "cleaner"
      }

      onLogin(userRole)
    } catch (err: any) {
      // If backend fails, try demo accounts as fallback
      if (email === "superadmin@site.com" && password === "super123") {
        onLogin("super_admin")
      } else if (email === "admin@site.com" && password === "admin123") {
        onLogin("admin")
      } else if (email === "sakin@site.com" && password === "sakin123") {
        onLogin("resident")
      } else if (email === "guvenlik@site.com" && password === "guvenlik123") {
        onLogin("security")
      } else if (email === "temizlik@site.com" && password === "temizlik123") {
        onLogin("cleaner")
      } else {
        setError(
          lang === "tr"
            ? err.message || "E-posta veya şifre hatalı"
            : lang === "en"
              ? err.message || "Invalid email or password"
              : lang === "de"
                ? err.message || "Неверный email или пароль"
                : err.message || "بريد إلكتروني أو كلمة مرور غير صحيحة",
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const demoAccounts = [
    { role: "super_admin" as UserRole, email: "superadmin@site.com", label: "Genel Yönetici" },
    { role: "admin" as UserRole, email: "admin@site.com", label: t("role_admin") },
    { role: "resident" as UserRole, email: "sakin@site.com", label: t("role_resident") },
    { role: "security" as UserRole, email: "guvenlik@site.com", label: t("role_security") },
    { role: "cleaner" as UserRole, email: "temizlik@site.com", label: t("role_cleaner") },
  ]

  return (
    <div className={`min-h-screen bg-background flex flex-col max-w-md mx-auto ${isRTL(lang) ? "rtl" : ""}`}>
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Globe className="w-4 h-4" />
              <span>{languageFlags[lang]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((l) => (
              <DropdownMenuItem key={l} onClick={() => onLangChange?.(l)} className={lang === l ? "bg-primary/10" : ""}>
                <span className="mr-2">{languageFlags[l]}</span>
                {languageNames[l]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("login_title")}</h1>
          <p className="text-muted-foreground mt-2">{t("login_subtitle")}</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">{t("login_email")}</Label>
            <div className="relative">
              <Mail
                className={`absolute ${isRTL(lang) ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`}
              />
              <Input
                id="email"
                type="email"
                placeholder="ornek@site.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${isRTL(lang) ? "pr-10" : "pl-10"} h-12 rounded-xl`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("login_password")}</Label>
            <div className="relative">
              <Lock
                className={`absolute ${isRTL(lang) ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`}
              />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${isRTL(lang) ? "pr-10 pl-10" : "pl-10 pr-10"} h-12 rounded-xl`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute ${isRTL(lang) ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive text-center"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" className="w-full h-12 rounded-xl text-base font-medium" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {t("login_button")}
                <ArrowRight className={`w-5 h-5 ${isRTL(lang) ? "mr-2 rotate-180" : "ml-2"}`} />
              </>
            )}
          </Button>

          <div className="text-center">
            <button type="button" className="text-sm text-primary hover:underline">
              {t("login_forgot")}
            </button>
          </div>
        </motion.form>

        {/* Demo Accounts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 pt-6 border-t border-border"
        >
          <p className="text-xs text-muted-foreground text-center mb-3">{t("login_demo")} (Password: rol123)</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => (
              <Button
                key={account.role}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-transparent"
                onClick={() => {
                  setEmail(account.email)
                  setPassword(`${account.role}123`)
                }}
              >
                {account.label}
              </Button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground">© 2026 {t("app_name")}</p>
      </div>
    </div>
  )
}


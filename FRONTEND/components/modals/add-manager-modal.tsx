"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  User, Mail, Phone, Building2, Key, Plus, Eye, EyeOff
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { managerService, type CreateManagerRequest } from "@/lib/services/manager.service"

interface AddManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sites?: Array<{ id: string; name: string; city?: string }>
}

interface ManagerFormData {
  full_name: string
  email: string
  phone: string
  password: string
  site_id: string
}

const initialFormData: ManagerFormData = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  site_id: ""
}

export function AddManagerModal({ open, onOpenChange, sites = [] }: AddManagerModalProps) {
  const [formData, setFormData] = useState<ManagerFormData>(initialFormData)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateFormData = (field: keyof ManagerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.full_name.trim()) newErrors.full_name = "Ad Soyad gerekli"
    if (!formData.email.trim()) newErrors.email = "E-posta gerekli"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Geçerli e-posta adresi girin"
    if (!formData.phone.trim()) newErrors.phone = "Telefon gerekli"
    if (!formData.password) newErrors.password = "Şifre gerekli"
    else if (formData.password.length < 6) newErrors.password = "Şifre en az 6 karakter olmalı"
    if (!formData.site_id) newErrors.site_id = "Site seçimi gerekli"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const requestData: CreateManagerRequest = {
        fullName: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password, // Manuel şifre
        siteId: formData.site_id
      }

      await managerService.createManager(requestData)
      
      toast({
        title: "Başarılı",
        description: `${formData.full_name} yönetici olarak eklendi.`,
      })
      
      // Reset form and close modal
      setFormData(initialFormData)
      setErrors({})
      onOpenChange(false)
    } catch (error: any) {
      console.error('Manager creation error:', error)
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Yönetici eklenirken bir hata oluştu",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Yeni Yönetici Ekle
          </DialogTitle>
          <DialogDescription>
            Site yöneticisi bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Ad Soyad *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => updateFormData("full_name", e.target.value)}
                placeholder="Örn: Mehmet Yılmaz"
                className={`pl-10 ${errors.full_name ? "border-destructive" : ""}`}
              />
            </div>
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-posta *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="mehmet@example.com"
                className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                placeholder="+90 555 123 4567"
                className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
              />
            </div>
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Şifre *</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                placeholder="Yönetici şifresi belirleyin"
                className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_id">Site *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Select value={formData.site_id} onValueChange={(value) => updateFormData("site_id", value)}>
                <SelectTrigger className={`pl-10 ${errors.site_id ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Site seçin" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} {site.city && `- ${site.city}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.site_id && <p className="text-xs text-destructive">{errors.site_id}</p>}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Not:</strong> Belirlediğiniz şifre ile yönetici sisteme giriş yapabilecek.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Ekleniyor..." : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Ekle
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

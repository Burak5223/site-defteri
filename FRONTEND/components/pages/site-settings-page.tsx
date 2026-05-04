"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Building,
  CreditCard,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import type { Site } from "@/lib/types"

interface SiteSettingsPageProps {
  currentSite?: Site
}

interface BankAccount {
  id: string
  bankName: string
  iban: string
  accountHolder: string
  isActive: boolean
}

export function SiteSettingsPage({ currentSite }: SiteSettingsPageProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: "1",
      bankName: "Ziraat Bankası",
      iban: "TR12 3456 7890 1234 5678 9012 34",
      accountHolder: "Yeşil Vadi Sitesi Yönetimi",
      isActive: true,
    },
  ])

  const [newAccount, setNewAccount] = useState({
    bankName: "",
    iban: "",
    accountHolder: "",
  })

  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddAccount = () => {
    if (newAccount.bankName && newAccount.iban && newAccount.accountHolder) {
      setBankAccounts([
        ...bankAccounts,
        {
          id: Date.now().toString(),
          ...newAccount,
          isActive: false,
        },
      ])
      setNewAccount({ bankName: "", iban: "", accountHolder: "" })
      setShowAddForm(false)
    }
  }

  const handleDeleteAccount = (id: string) => {
    setBankAccounts(bankAccounts.filter((acc) => acc.id !== id))
  }

  const handleToggleActive = (id: string) => {
    setBankAccounts(
      bankAccounts.map((acc) =>
        acc.id === id ? { ...acc, isActive: !acc.isActive } : acc
      )
    )
  }

  const formatIBAN = (iban: string) => {
    return iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim()
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Site Ayarları</h1>
          <p className="text-sm text-muted-foreground">{currentSite?.name || "Site"}</p>
        </div>
      </div>

      {/* Bank Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Banka Hesapları
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Aidat ödemeleri için kullanılacak hesaplar
            </p>
          </div>
          {!showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Ekle
            </Button>
          )}
        </div>

        {/* Add New Account Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/50">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">Banka Adı</Label>
                  <Input
                    placeholder="Örn: Ziraat Bankası"
                    value={newAccount.bankName}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, bankName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">IBAN</Label>
                  <Input
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    value={newAccount.iban}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        iban: formatIBAN(e.target.value),
                      })
                    }
                    maxLength={32}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Hesap Sahibi</Label>
                  <Input
                    placeholder="Örn: Yeşil Vadi Sitesi Yönetimi"
                    value={newAccount.accountHolder}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        accountHolder: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewAccount({ bankName: "", iban: "", accountHolder: "" })
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleAddAccount}
                    disabled={
                      !newAccount.bankName ||
                      !newAccount.iban ||
                      !newAccount.accountHolder
                    }
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bank Accounts List */}
        <div className="space-y-3">
          {bankAccounts.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="p-8 text-center">
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Henüz banka hesabı eklenmemiş
                </p>
              </CardContent>
            </Card>
          ) : (
            bankAccounts.map((account) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  className={
                    account.isActive
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : ""
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{account.bankName}</p>
                          {account.isActive && (
                            <Badge
                              variant="default"
                              className="bg-emerald-500 text-white text-[10px]"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Aktif
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {account.accountHolder}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-muted-foreground mb-1">IBAN</p>
                      <p className="font-mono text-sm">{account.iban}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">
                        Ödemelerde Göster
                      </Label>
                      <Switch
                        checked={account.isActive}
                        onCheckedChange={() => handleToggleActive(account.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {bankAccounts.length > 0 && (
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-600">Önemli Bilgi</p>
                <p className="text-xs text-amber-600 mt-1">
                  Aktif olarak işaretlenen hesap bilgileri, sakinlerin aidat ödeme
                  ekranında görüntülenecektir.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


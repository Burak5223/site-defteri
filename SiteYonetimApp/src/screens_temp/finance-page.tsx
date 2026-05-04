"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Plus,
  Download,
  Zap,
  Droplets,
  Flame,
  Building2,
  Sparkles,
  Shield,
  TreePine,
  FileText,
  PiggyBank,
  MoreHorizontal,
  X,
  Receipt,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { financeService } from "@/lib/services/finance.service"
import type { Site, TransactionCategory } from "@/lib/types"

interface FinancePageProps {
  currentSite: Site
  role?: "admin" | "resident" | "cleaner" | "security"
}

const categoryIcons: Record<TransactionCategory, React.ElementType> = {
  dues: Wallet,
  maintenance: Building2,
  cleaning: Sparkles,
  security: Shield,
  electricity: Zap,
  water: Droplets,
  gas: Flame,
  elevator: Building2,
  garden: TreePine,
  insurance: FileText,
  salary: PiggyBank,
  other: MoreHorizontal,
}

const categoryLabels: Record<TransactionCategory, string> = {
  dues: "Aidat",
  maintenance: "Bakım",
  cleaning: "Temizlik",
  security: "Güvenlik",
  electricity: "Elektrik",
  water: "Su",
  gas: "Doğalgaz",
  elevator: "Asansör",
  garden: "Bahçe",
  insurance: "Sigorta",
  salary: "Maaş",
  other: "Diğer",
}

const months = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
]

export function FinancePage({ currentSite, role = "admin" }: FinancePageProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "income" | "expense">("overview")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState<TransactionCategory | "all">("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Form states
  const [incomeForm, setIncomeForm] = useState({
    category: "aidat",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  })

  const [expenseForm, setExpenseForm] = useState({
    category: "elektrik",
    description: "",
    amount: "",
    vendorName: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  // Load expenses from backend
  const loadExpenses = async () => {
    try {
      setIsLoading(true)
      const data = await financeService.getExpensesBySite(currentSite.id)
      setExpenses(data)
    } catch (error) {
      console.error("Error loading expenses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load expenses on mount
  useEffect(() => {
    loadExpenses()
  }, [currentSite.id])

  // Convert backend expenses to transaction format with proper category mapping
  const categoryMapping: Record<string, TransactionCategory> = {
    aidat: "dues",
    elektrik: "electricity",
    su: "water",
    dogalgaz: "gas",
    guvenlik: "security",
    temizlik: "cleaning",
    bakim: "maintenance",
    asansor: "elevator",
    bahce: "garden",
    sigorta: "insurance",
    maas: "salary",
    other: "other",
  }

  const backendTransactions = expenses.map((expense) => {
    // Determine if it's income or expense based on category
    const isIncome = expense.category === "aidat" || expense.category === "other"
    const mappedCategory = categoryMapping[expense.category] || "other"
    
    return {
      id: expense.id,
      siteId: expense.siteId,
      type: isIncome ? ("income" as const) : ("expense" as const),
      category: mappedCategory,
      description: expense.description,
      amount: parseFloat(expense.amount),
      date: expense.expenseDate,
      status: "completed" as const,
    }
  })

  // Use only backend transactions (remove mock data)
  const allTransactions = backendTransactions

  // Get current month and year
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentYear = now.getFullYear()

  const filteredTransactions = allTransactions
    .filter((t) => {
      const tDate = new Date(t.date)
      return tDate.getMonth() + 1 === currentMonth && tDate.getFullYear() === currentYear
    })
    .filter((t) => {
      if (activeTab === "income") return t.type === "income"
      if (activeTab === "expense") return t.type === "expense"
      return true
    })
    .filter((t) => filterCategory === "all" || t.category === filterCategory)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calculate real totals from backend data for current month
  const currentMonthTransactions = allTransactions.filter((t) => {
    const tDate = new Date(t.date)
    return tDate.getMonth() + 1 === currentMonth && tDate.getFullYear() === currentYear
  })

  const displayIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const displayExpense = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const displayBalance = displayIncome - displayExpense

  // Expense breakdown by category for current month
  const expenseByCategory = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      },
      {} as Record<TransactionCategory, number>,
    )

  const totalExpenseForChart = Object.values(expenseByCategory).reduce((a, b) => a + b, 0)

  // Calculate last 6 months data for chart
  const last6MonthsData: Array<{
    month: string
    income: number
    expense: number
    balance: number
  }> = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const monthTransactions = allTransactions.filter((t) => {
      const tDate = new Date(t.date)
      return tDate.getMonth() + 1 === month && tDate.getFullYear() === year
    })

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    last6MonthsData.push({
      month: months[month - 1],
      income,
      expense,
      balance: income - expense,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    })
  }

  const handleIncomeSubmit = async () => {
    if (!incomeForm.description || !incomeForm.amount) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await financeService.createExpense({
        siteId: currentSite.id,
        category: incomeForm.category,
        description: incomeForm.description,
        amount: parseFloat(incomeForm.amount),
        currencyCode: "TRY",
        expenseDate: incomeForm.date,
      })

      toast({
        title: "Başarılı",
        description: "Gelir kaydı eklendi",
      })

      // Reset form
      setIncomeForm({
        category: "aidat",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
      })
      setShowIncomeForm(false)
      setShowAddModal(false)
      
      // Reload expenses
      await loadExpenses()
    } catch (error) {
      toast({
        title: "Hata",
        description: "Gelir kaydı eklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExpenseSubmit = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await financeService.createExpense({
        siteId: currentSite.id,
        category: expenseForm.category,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        currencyCode: "TRY",
        expenseDate: expenseForm.date,
        vendorName: expenseForm.vendorName || undefined,
        notes: expenseForm.notes || undefined,
      })

      toast({
        title: "Başarılı",
        description: "Gider kaydı eklendi",
      })

      // Reset form
      setExpenseForm({
        category: "elektrik",
        description: "",
        amount: "",
        vendorName: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      })
      setShowExpenseForm(false)
      setShowAddModal(false)
      
      // Reload expenses
      await loadExpenses()
    } catch (error) {
      toast({
        title: "Hata",
        description: "Gider kaydı eklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 space-y-5">
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground mt-2">Yükleniyor...</p>
        </div>
      )}

      {!isLoading && (
        <>
      {/* Current Month Display */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold">{months[new Date().getMonth()]} {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Gelir</span>
              </div>
              <p className="text-sm font-bold text-emerald-500">{formatCurrency(displayIncome)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-rose-500/10 border-rose-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <ArrowDownRight className="w-3 h-3 text-rose-500" />
                <span className="text-[10px] text-muted-foreground">Gider</span>
              </div>
              <p className="text-sm font-bold text-rose-500">{formatCurrency(displayExpense)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card
            className={
              displayBalance >= 0 ? "bg-primary/10 border-primary/20" : "bg-amber-500/10 border-amber-500/20"
            }
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <Wallet className={`w-3 h-3 ${displayBalance >= 0 ? "text-primary" : "text-amber-500"}`} />
                <span className="text-[10px] text-muted-foreground">Bakiye</span>
              </div>
              <p className={`text-sm font-bold ${displayBalance >= 0 ? "text-primary" : "text-amber-500"}`}>
                {formatCurrency(displayBalance)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mini Chart - Last 6 Months */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Son 6 Ay Trend</h3>
            <Badge variant="outline" className="text-[10px]">
              {displayBalance >= 0 ? (
                <span className="flex items-center gap-1 text-emerald-500">
                  <TrendingUp className="w-3 h-3" /> Pozitif
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-500">
                  <TrendingDown className="w-3 h-3" /> Negatif
                </span>
              )}
            </Badge>
          </div>
          <div className="flex items-end justify-between gap-2 h-24">
            {last6MonthsData.map((report, index) => {
              const maxValue = Math.max(...last6MonthsData.map((r) => Math.max(r.income, r.expense)))
              const incomeHeight = maxValue > 0 ? (report.income / maxValue) * 100 : 0
              const expenseHeight = maxValue > 0 ? (report.expense / maxValue) * 100 : 0
              const isCurrentMonth = index === 5

              return (
                <div key={`${report.month}-${index}`} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex gap-0.5 items-end h-16 w-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${incomeHeight}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className={`flex-1 rounded-t ${isCurrentMonth ? "bg-emerald-500" : "bg-emerald-500/40"}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${expenseHeight}%` }}
                      transition={{ delay: index * 0.1 + 0.05, duration: 0.5 }}
                      className={`flex-1 rounded-t ${isCurrentMonth ? "bg-rose-500" : "bg-rose-500/40"}`}
                    />
                  </div>
                  <span
                    className={`text-[9px] ${isCurrentMonth ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {report.month.slice(0, 3)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">Gelir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[10px] text-muted-foreground">Gider</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      {activeTab !== "income" && totalExpenseForChart > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Gider Dağılımı</h3>
            <div className="space-y-2">
              {Object.entries(expenseByCategory)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, amount], index) => {
                  const percentage = (amount / totalExpenseForChart) * 100
                  const Icon = categoryIcons[category as TransactionCategory]

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{categoryLabels[category as TransactionCategory]}</span>
                          <span className="text-xs text-muted-foreground">{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                            className="h-full bg-rose-500 rounded-full"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground w-10 text-right">
                        {percentage.toFixed(0)}%
                      </span>
                    </motion.div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dues Status */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Aidat Durumu</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-emerald-500/10">
              <p className="text-lg font-bold text-emerald-500">{formatCurrency(displayIncome)}</p>
              <p className="text-[10px] text-muted-foreground">Tahsil Edilen</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-500/10">
              <p className="text-lg font-bold text-amber-500">{formatCurrency(0)}</p>
              <p className="text-[10px] text-muted-foreground">Bekleyen</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-rose-500/10">
              <p className="text-lg font-bold text-rose-500">{formatCurrency(0)}</p>
              <p className="text-[10px] text-muted-foreground">Gecikmiş</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Filter */}
      <div className="flex gap-2">
        {[
          { id: "overview", label: "Tümü" },
          { id: "income", label: "Gelirler" },
          { id: "expense", label: "Giderler" },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="flex-1"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">İşlem Geçmişi</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-transparent">
              <Download className="w-3 h-3" />
              <span className="text-xs">Rapor</span>
            </Button>
            {role === "admin" && (
              <Button size="sm" className="h-8 gap-1.5" onClick={() => setShowAddModal(true)}>
                <Plus className="w-3 h-3" />
                <span className="text-xs">Ekle</span>
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction, index) => {
              const Icon = categoryIcons[transaction.category]
              const isIncome = transaction.type === "income"

              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncome ? "bg-emerald-500/10" : "bg-rose-500/10"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isIncome ? "text-emerald-500" : "text-rose-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{transaction.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {categoryLabels[transaction.category]}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{formatDate(transaction.date)}</span>
                          </div>
                        </div>
                        <p className={`text-sm font-bold ${isIncome ? "text-emerald-500" : "text-rose-500"}`}>
                          {isIncome ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <Receipt className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Bu dönemde işlem bulunmuyor</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-x-4 bottom-4 max-w-md mx-auto bg-card border border-border rounded-2xl z-50 shadow-xl"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold">Yeni İşlem Ekle</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 border-emerald-500/30 hover:bg-emerald-500/10 bg-transparent"
                    onClick={() => {
                      setShowAddModal(false)
                      setShowIncomeForm(true)
                    }}
                  >
                    <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                    <span className="text-sm">Gelir Ekle</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 border-rose-500/30 hover:bg-rose-500/10 bg-transparent"
                    onClick={() => {
                      setShowAddModal(false)
                      setShowExpenseForm(true)
                    }}
                  >
                    <ArrowDownRight className="w-6 h-6 text-rose-500" />
                    <span className="text-sm">Gider Ekle</span>
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  İşlem eklemek için yukarıdaki butonlardan birini seçin
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Income Form Modal */}
      <AnimatePresence>
        {showIncomeForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setShowIncomeForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-x-4 bottom-4 max-w-md mx-auto bg-card border border-border rounded-2xl z-50 shadow-xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <h2 className="font-semibold flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  Gelir Ekle
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowIncomeForm(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="income-category">Kategori *</Label>
                  <Select
                    value={incomeForm.category}
                    onValueChange={(value) => setIncomeForm({ ...incomeForm, category: value })}
                  >
                    <SelectTrigger id="income-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aidat">Aidat</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income-description">Açıklama *</Label>
                  <Textarea
                    id="income-description"
                    placeholder="Gelir açıklaması..."
                    value={incomeForm.description}
                    onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income-amount">Tutar (TRY) *</Label>
                  <Input
                    id="income-amount"
                    type="number"
                    placeholder="0.00"
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income-date">Tarih *</Label>
                  <Input
                    id="income-date"
                    type="date"
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowIncomeForm(false)}
                    disabled={isSubmitting}
                  >
                    İptal
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                    onClick={handleIncomeSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Ekleniyor..." : "Ekle"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Expense Form Modal */}
      <AnimatePresence>
        {showExpenseForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setShowExpenseForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-x-4 bottom-4 max-w-md mx-auto bg-card border border-border rounded-2xl z-50 shadow-xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <h2 className="font-semibold flex items-center gap-2">
                  <ArrowDownRight className="w-5 h-5 text-rose-500" />
                  Gider Ekle
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowExpenseForm(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Kategori *</Label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                  >
                    <SelectTrigger id="expense-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elektrik">Elektrik</SelectItem>
                      <SelectItem value="su">Su</SelectItem>
                      <SelectItem value="dogalgaz">Doğalgaz</SelectItem>
                      <SelectItem value="guvenlik">Güvenlik</SelectItem>
                      <SelectItem value="temizlik">Temizlik</SelectItem>
                      <SelectItem value="bakim">Bakım</SelectItem>
                      <SelectItem value="asansor">Asansör</SelectItem>
                      <SelectItem value="bahce">Bahçe</SelectItem>
                      <SelectItem value="sigorta">Sigorta</SelectItem>
                      <SelectItem value="maas">Maaş</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense-description">Açıklama *</Label>
                  <Textarea
                    id="expense-description"
                    placeholder="Gider açıklaması..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Tutar (TRY) *</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense-vendor">Tedarikçi</Label>
                  <Input
                    id="expense-vendor"
                    placeholder="Tedarikçi adı..."
                    value={expenseForm.vendorName}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendorName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense-date">Tarih *</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense-notes">Notlar</Label>
                  <Textarea
                    id="expense-notes"
                    placeholder="Ek notlar..."
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowExpenseForm(false)}
                    disabled={isSubmitting}
                  >
                    İptal
                  </Button>
                  <Button
                    className="flex-1 bg-rose-500 hover:bg-rose-600"
                    onClick={handleExpenseSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Ekleniyor..." : "Ekle"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  )
}


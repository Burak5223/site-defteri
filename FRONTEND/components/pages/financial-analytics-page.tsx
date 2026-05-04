"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, 
  Calendar, Download, Filter, ArrowUpRight, ArrowDownRight
} from "lucide-react"
import { financeService } from "@/lib/services/finance.service"
import type { UserRole, Site } from "@/lib/types"

interface FinancialAnalyticsPageProps {
  role: UserRole
  currentSite: Site
}

const budgetVsActual = [
  { category: "Personel", budget: 50000, actual: 45000, variance: -5000 },
  { category: "Bakım", budget: 30000, actual: 35000, variance: 5000 },
  { category: "Enerji", budget: 15000, actual: 15000, variance: 0 },
  { category: "Temizlik", budget: 12000, actual: 10000, variance: -2000 },
]

export function FinancialAnalyticsPage({ role, currentSite }: FinancialAnalyticsPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("6months")
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load expenses from backend
  useEffect(() => {
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
    loadExpenses()
  }, [currentSite.id])

  // Process expenses into monthly data
  const processMonthlyData = () => {
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
    const monthlyMap = new Map<string, { income: number; expense: number }>()

    expenses.forEach((exp) => {
      const date = new Date(exp.expenseDate)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      const isIncome = exp.category === "aidat" || exp.category === "other"
      const amount = parseFloat(exp.amount)

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { income: 0, expense: 0 })
      }

      const monthData = monthlyMap.get(monthKey)!
      if (isIncome) {
        monthData.income += amount
      } else {
        monthData.expense += amount
      }
    })

    // Convert to array and sort by date
    const monthlyArray = Array.from(monthlyMap.entries())
      .map(([key, data]) => {
        const [year, month] = key.split("-").map(Number)
        return {
          month: monthNames[month],
          year,
          monthNum: month,
          income: data.income,
          expense: data.expense,
          balance: data.income - data.expense,
        }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.monthNum - b.monthNum
      })

    // Get last 6 months
    return monthlyArray.slice(-6)
  }

  // Process expense categories
  const processExpenseCategories = () => {
    const categoryMap = new Map<string, number>()
    let totalExpense = 0

    expenses.forEach((exp) => {
      const isIncome = exp.category === "aidat" || exp.category === "other"
      if (!isIncome) {
        const amount = parseFloat(exp.amount)
        categoryMap.set(exp.category, (categoryMap.get(exp.category) || 0) + amount)
        totalExpense += amount
      }
    })

    const categoryLabels: Record<string, string> = {
      elektrik: "Elektrik",
      su: "Su",
      dogalgaz: "Doğalgaz",
      guvenlik: "Güvenlik",
      temizlik: "Temizlik",
      bakim: "Bakım",
      asansor: "Asansör",
      bahce: "Bahçe",
      sigorta: "Sigorta",
      maas: "Maaş",
      other: "Diğer",
    }

    const colors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-cyan-500",
      "bg-gray-500",
    ]

    return Array.from(categoryMap.entries())
      .map(([category, amount], index) => ({
        name: categoryLabels[category] || category,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  const monthlyData = processMonthlyData()
  const expenseCategories = processExpenseCategories()

  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0)
  const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0)
  const totalBalance = totalIncome - totalExpense
  const avgMonthlyIncome = monthlyData.length > 0 ? totalIncome / monthlyData.length : 0
  const avgMonthlyExpense = monthlyData.length > 0 ? totalExpense / monthlyData.length : 0

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Finansal Analitik</h1>
          <p className="text-sm text-muted-foreground">Detaylı finansal raporlar ve analizler</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Rapor İndir
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["1month", "3months", "6months", "1year", "all"].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
            className="shrink-0"
          >
            {period === "1month" ? "1 Ay" : 
             period === "3months" ? "3 Ay" :
             period === "6months" ? "6 Ay" :
             period === "1year" ? "1 Yıl" : "Tümü"}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Toplam Gelir</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-500">₺{totalIncome.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              <span className="text-xs text-emerald-500">+12% bu ay</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Toplam Gider</span>
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">₺{totalExpense.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowDownRight className="w-3 h-3 text-destructive" />
              <span className="text-xs text-destructive">+8% bu ay</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Net Bakiye</span>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">₺{totalBalance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Son 6 ay</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Yedek Fon</span>
              <PieChart className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-500">₺85,000</p>
            <p className="text-xs text-muted-foreground mt-1">Hedef: ₺100,000</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="categories">Kategoriler</TabsTrigger>
          <TabsTrigger value="budget">Bütçe</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Aylık Gelir-Gider Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyData.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{data.month}</span>
                      <span className="text-muted-foreground">₺{data.balance.toLocaleString()}</span>
                    </div>
                    <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-emerald-500/30"
                        style={{ width: `${(data.income / 150000) * 100}%` }}
                      />
                      <div 
                        className="absolute left-0 top-0 h-full bg-destructive/30"
                        style={{ width: `${(data.expense / 150000) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-500">Gelir: ₺{data.income.toLocaleString()}</span>
                      <span className="text-destructive">Gider: ₺{data.expense.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Gider Kategorileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {expenseCategories.map((cat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground">₺{cat.amount.toLocaleString()}</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`absolute left-0 top-0 h-full ${cat.color}`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{cat.percentage}% toplam gider</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bütçe vs Gerçekleşen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {budgetVsActual.map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.category}</span>
                    <Badge variant={item.variance > 0 ? "destructive" : "default"}>
                      {item.variance > 0 ? "+" : ""}₺{item.variance.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Bütçe</p>
                      <p className="font-medium">₺{item.budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gerçekleşen</p>
                      <p className="font-medium">₺{item.actual.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forecasting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Tahmin ve Öngörüler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-blue-500/10">
            <p className="text-sm font-medium mb-1">Gelecek Ay Tahmini</p>
            <p className="text-xs text-muted-foreground">Mevcut trende göre gelecek ay gelir: ₺148,000</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10">
            <p className="text-sm font-medium mb-1">Yedek Fon Hedefi</p>
            <p className="text-xs text-muted-foreground">Hedefe ulaşmak için 3 ay daha gerekiyor</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


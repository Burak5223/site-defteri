"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  X,
  ChevronRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Banknote,
  Smartphone,
  Shield,
  RefreshCw,
} from "lucide-react"
import { mockDues, mockMonthlyReports, mockApartments, mockBlocks } from "@/lib/mock-data"
import type { UserRole, Site } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { financeService } from "@/lib/services/finance.service"
import { useToast } from "@/hooks/use-toast"
import { PaymentModal } from "@/components/payment-modal"

interface DuesPageProps {
  role: UserRole
  currentSite?: Site
}

const currencies = [
  { value: "TRY", label: "₺ TRY", symbol: "₺" },
  { value: "USD", label: "$ USD", symbol: "$" },
  { value: "EUR", label: "€ EUR", symbol: "€" },
]

const installmentOptions = [
  { value: 1, label: "Tek Çekim", fee: 0 },
  { value: 2, label: "2 Taksit", fee: 0 },
  { value: 3, label: "3 Taksit", fee: 1.5 },
  { value: 6, label: "6 Taksit", fee: 3 },
  { value: 9, label: "9 Taksit", fee: 5 },
  { value: 12, label: "12 Taksit", fee: 7 },
]

const paymentMethods = [
  { id: "card", label: "Kredi/Banka Kartı", icon: CreditCard, description: "Visa, Mastercard, Troy" },
  { id: "virtual-pos", label: "Sanal POS", icon: Smartphone, description: "3D Secure ile güvenli ödeme" },
  { id: "iban", label: "Havale/EFT", icon: Building, description: "Banka hesabına transfer" },
  { id: "cash", label: "Nakit", icon: Banknote, description: "Yönetim ofisine ödeme" },
]

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

export function DuesPage({ role, currentSite }: DuesPageProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showFinanceModal, setShowFinanceModal] = useState(false)
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false)
  const [selectedDues, setSelectedDues] = useState<string[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState("TRY")
  const [selectedInstallment, setSelectedInstallment] = useState(1)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card")
  const [paymentStep, setPaymentStep] = useState<"method" | "details" | "confirm">("method")
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    TRY: 1,
    USD: 34.50,
    EUR: 37.80,
    GBP: 43.20,
  })
  const [loadingRates, setLoadingRates] = useState(false)
  const [dues, setDues] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [bulkAmount, setBulkAmount] = useState("")
  const [bulkMonth, setBulkMonth] = useState((new Date().getMonth() + 2).toString())
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear().toString())
  const [bulkDueDay, setBulkDueDay] = useState("15")
  const [bulkPeriod, setBulkPeriod] = useState("1") // 1, 3, 6, 12 ay
  const [bulkBankName, setBulkBankName] = useState("Ziraat Bankası")
  const [bulkIban, setBulkIban] = useState("TR12 3456 7890 1234 5678 9012 34")
  const [bulkAccountHolder, setBulkAccountHolder] = useState("")
  const [excludedBlocks, setExcludedBlocks] = useState<string[]>([])
  const [excludedApartments, setExcludedApartments] = useState<string[]>([])
  const { toast } = useToast()

  // New PaymentModal state
  const [showPaymentModalNew, setShowPaymentModalNew] = useState(false)
  const [selectedDueForPayment, setSelectedDueForPayment] = useState<any>(null)

  // Şirket komisyon bilgileri
  const COMPANY_COMMISSION_RATE = 2 // %2
  const COMPANY_IBAN = "TR98 7654 3210 9876 5432 1098 76"
  const COMPANY_NAME = "Smart Site Management A.Ş."

  // Load dues from backend
  useEffect(() => {
    loadDues()
    fetchExchangeRates()
  }, [])

  const loadDues = async () => {
    setIsLoading(true)
    
    try {
      const data = await financeService.getMyDues()
      // Transform backend data to frontend format
      setDues(data.map(d => ({
        id: d.id,
        apartmentId: d.apartmentId,
        amount: d.amount,
        dueDate: d.dueDate,
        status: d.status === 'BEKLIYOR' ? 'pending' : d.status === 'ODENDI' ? 'paid' : d.status === 'GECIKMIS' ? 'overdue' : 'cancelled',
        description: d.description || '',
        periodMonth: new Date(d.dueDate).getMonth() + 1,
        periodYear: new Date(d.dueDate).getFullYear(),
        bankName: 'Ziraat Bankası', // TODO: Get from backend
        iban: 'TR12 3456 7890 1234 5678 9012 34', // TODO: Get from backend
        accountHolder: currentSite?.name || 'Site Yönetimi', // TODO: Get from backend
      })))
    } catch (error: any) {
      // Silently fallback to mock data (backend not running)
      setDues(mockDues)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDues = activeTab === "all" ? dues : dues.filter((d) => d.status === activeTab)
  const totalPending = dues
    .filter((d) => d.status === "pending" || d.status === "overdue")
    .reduce((a, b) => a + b.amount, 0)
  const selectedTotal = dues.filter((d) => selectedDues.includes(d.id)).reduce((a, b) => a + b.amount, 0)

  const selectedInstallmentOption = installmentOptions.find((o) => o.value === selectedInstallment)
  const installmentFee = selectedInstallmentOption?.fee || 0
  
  // Döviz kuru hesaplaması
  const exchangeRate = exchangeRates[selectedCurrency] || 1
  const totalInSelectedCurrency = selectedTotal / exchangeRate
  const totalWithFee = totalInSelectedCurrency * (1 + installmentFee / 100)
  const totalInTRY = totalWithFee * exchangeRate

  // Komisyon hesaplaması
  const commissionAmount = selectedTotal * (COMPANY_COMMISSION_RATE / 100)
  const siteReceivesAmount = selectedTotal - commissionAmount

  // Döviz kuru çekme fonksiyonu
  const fetchExchangeRates = async () => {
    setLoadingRates(true)
    try {
      // Gerçek API: https://api.exchangerate-api.com/v4/latest/TRY
      // veya TCMB: https://www.tcmb.gov.tr/kurlar/today.xml
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/TRY")
      const data = await response.json()
      
      setExchangeRates({
        TRY: 1,
        USD: 1 / data.rates.USD,
        EUR: 1 / data.rates.EUR,
        GBP: 1 / data.rates.GBP,
      })
    } catch (error) {
      console.error("Kur bilgisi alınamadı:", error)
      // Fallback: Manuel kurlar
      setExchangeRates({
        TRY: 1,
        USD: 34.50,
        EUR: 37.80,
        GBP: 43.20,
      })
    } finally {
      setLoadingRates(false)
    }
  }

  // Component mount olduğunda kurları çek
  // (Already handled in useEffect above)

  const handleBulkAssignment = async () => {
    try {
      // TEMPORARY: Use hardcoded apartment IDs for testing
      // TODO: Get real apartment IDs from backend
      const apartmentIds = ["1", "2", "3"]; // Hardcoded for testing

      if (apartmentIds.length === 0) {
        toast({
          title: "Hata",
          description: "Aidat atanacak daire bulunamadı",
          variant: "destructive",
        })
        return
      }

      // Calculate due date
      const dueDate = new Date(Number(bulkYear), Number(bulkMonth) - 1, Number(bulkDueDay))
      
      // Create bulk dues
      await financeService.createBulkDues({
        apartmentIds,
        amount: Number(bulkAmount) * Number(bulkPeriod),
        dueDate: dueDate.toISOString(),
        description: `${bulkPeriod} Aylık Aidat - ${getMonthName(Number(bulkMonth))} ${bulkYear}`,
      })

      toast({
        title: "Başarılı",
        description: `${apartmentIds.length} daireye aidat atandı`,
      })

      setShowBulkAssignModal(false)
      loadDues() // Reload dues
    } catch (error: any) {
      console.error('Bulk dues error:', error)
      toast({
        title: "Hata",
        description: error.message || "Aidat ataması başarısız",
        variant: "destructive",
      })
    }
  }

  const handleInitiatePayment = async () => {
    if (selectedDues.length === 0) {
      toast({
        title: "Hata",
        description: "Lütfen ödenecek aidatları seçin",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await financeService.initPayment({
        dueIds: selectedDues,
      })

      // Redirect to payment gateway
      window.location.href = response.checkoutUrl

      toast({
        title: "Yönlendiriliyor",
        description: "Ödeme sayfasına yönlendiriliyorsunuz...",
      })
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Ödeme başlatılamadı",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return CheckCircle2
      case "pending":
        return Clock
      case "overdue":
        return AlertCircle
      default:
        return CreditCard
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/10 text-emerald-500"
      case "pending":
        return "bg-amber-500/10 text-amber-500"
      case "overdue":
        return "bg-rose-500/10 text-rose-500"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Ödendi"
      case "pending":
        return "Bekliyor"
      case "overdue":
        return "Gecikmiş"
      default:
        return status
    }
  }

  const getMonthName = (month: number) => months[month - 1]

  const formatCurrency = (amount: number, currency = "TRY") => {
    const curr = currencies.find((c) => c.value === currency)
    return `${curr?.symbol || "₺"}${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const toggleDueSelection = (dueId: string) => {
    setSelectedDues((prev) => (prev.includes(dueId) ? prev.filter((id) => id !== dueId) : [...prev, dueId]))
  }

  const handlePaySelected = () => {
    if (selectedDues.length > 0) {
      setPaymentStep("method")
      setShowPaymentModal(true)
    }
  }

  const currentReport = mockMonthlyReports[0]
  const siteBlocks = mockBlocks.filter((b) => b.siteId === currentSite?.id || b.siteId === "1")
  const siteApartments = mockApartments.filter((a) => !excludedBlocks.includes(a.blockId))
  const totalApartmentsToAssign = siteApartments.length - excludedApartments.length

  const renderPaymentModal = () => (
    <AnimatePresence>
      {showPaymentModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={() => setShowPaymentModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-4 bottom-4 max-w-md mx-auto bg-card border border-border rounded-2xl z-50 shadow-xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-semibold">Aidat Ödemesi</h2>
                <p className="text-xs text-muted-foreground">
                  {paymentStep === "method" && "Ödeme yöntemi seçin"}
                  {paymentStep === "details" && "Ödeme detayları"}
                  {paymentStep === "confirm" && "Ödemeyi onaylayın"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowPaymentModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2">
                {["method", "details", "confirm"].map((step, index) => (
                  <div key={step} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                        paymentStep === step
                          ? "bg-primary text-primary-foreground"
                          : ["method", "details", "confirm"].indexOf(paymentStep) > index
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </div>
                    {index < 2 && (
                      <div
                        className={cn(
                          "w-8 h-0.5",
                          ["method", "details", "confirm"].indexOf(paymentStep) > index ? "bg-primary" : "bg-muted",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Selected dues summary */}
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Seçili Aidatlar</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {dues
                        .filter((d) => selectedDues.includes(d.id))
                        .slice(0, 3)
                        .map((due) => (
                          <Badge key={due.id} variant="secondary" className="text-[10px]">
                            {getMonthName(due.periodMonth)}
                          </Badge>
                        ))}
                      {selectedDues.length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{selectedDues.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step: Payment Method */}
              {paymentStep === "method" && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Ödeme Yöntemi Seçin</Label>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon
                      return (
                        <Card
                          key={method.id}
                          className={cn(
                            "cursor-pointer transition-all",
                            selectedPaymentMethod === method.id
                              ? "border-primary ring-2 ring-primary/20"
                              : "hover:bg-muted/50",
                          )}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center",
                                  selectedPaymentMethod === method.id
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{method.label}</p>
                                <p className="text-xs text-muted-foreground">{method.description}</p>
                              </div>
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                  selectedPaymentMethod === method.id
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/30",
                                )}
                              >
                                {selectedPaymentMethod === method.id && (
                                  <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step: Payment Details */}
              {paymentStep === "details" && (
                <div className="space-y-5">
                  {/* Currency Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Para Birimi</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={fetchExchangeRates}
                        disabled={loadingRates}
                      >
                        <RefreshCw className={cn("w-3 h-3", loadingRates && "animate-spin")} />
                        <span className="text-xs ml-1">Kurları Güncelle</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {currencies.map((curr) => (
                        <Button
                          key={curr.value}
                          type="button"
                          variant={selectedCurrency === curr.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCurrency(curr.value)}
                          className={cn(
                            "flex-col h-auto py-2",
                            selectedCurrency !== curr.value && "bg-transparent"
                          )}
                        >
                          <span>{curr.label}</span>
                          {curr.value !== "TRY" && (
                            <span className="text-[10px] opacity-70">
                              1 {curr.symbol} = {exchangeRates[curr.value]?.toFixed(2)} ₺
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                    {selectedCurrency !== "TRY" && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                        <p className="text-xs text-blue-600">
                          💱 Güncel kur: 1 {currencies.find((c) => c.value === selectedCurrency)?.symbol} ={" "}
                          {exchangeRates[selectedCurrency]?.toFixed(4)} ₺
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Installment Selection - only for card payments */}
                  {(selectedPaymentMethod === "card" || selectedPaymentMethod === "virtual-pos") && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Taksit Seçeneği</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {installmentOptions.map((opt) => (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={selectedInstallment === opt.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedInstallment(opt.value)}
                            className={cn(
                              "flex-col h-auto py-2",
                              selectedInstallment !== opt.value && "bg-transparent",
                            )}
                          >
                            <span>{opt.label}</span>
                            {opt.fee > 0 && <span className="text-[10px] opacity-70">+%{opt.fee} komisyon</span>}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Form based on method */}
                  {(selectedPaymentMethod === "card" || selectedPaymentMethod === "virtual-pos") && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Kart Bilgileri</Label>
                      <Input placeholder="Kart Üzerindeki İsim" />
                      <Input placeholder="Kart Numarası" className="font-mono" maxLength={19} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="AA/YY" maxLength={5} />
                        <Input placeholder="CVV" type="password" maxLength={4} />
                      </div>
                      {selectedPaymentMethod === "virtual-pos" && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <Shield className="w-4 h-4 text-emerald-500" />
                          <p className="text-xs text-emerald-600">3D Secure ile güvenli ödeme yapılacak</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedPaymentMethod === "iban" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Havale/EFT Bilgileri</Label>
                      <Card className="bg-muted/30">
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Banka</p>
                            <p className="font-medium">
                              {dues.find((d) => selectedDues.includes(d.id))?.bankName || "Ziraat Bankası"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">IBAN</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-sm flex-1">
                                {dues.find((d) => selectedDues.includes(d.id))?.iban ||
                                  "TR12 3456 7890 1234 5678 9012 34"}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const iban =
                                    dues.find((d) => selectedDues.includes(d.id))?.iban ||
                                    "TR12345678901234567890123"
                                  navigator.clipboard.writeText(iban.replace(/\s/g, ""))
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Hesap Sahibi</p>
                            <p className="font-medium">
                              {dues.find((d) => selectedDues.includes(d.id))?.accountHolder ||
                                `${currentSite?.name || "Site"} Yönetimi`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Açıklama (Mutlaka yazınız)</p>
                            <p className="font-mono text-sm bg-primary/10 p-2 rounded">
                              {dues.find((d) => selectedDues.includes(d.id))
                                ? `A-12 ${getMonthName(dues.find((d) => selectedDues.includes(d.id))!.periodMonth).toUpperCase()} AIDAT`
                                : "BLOK-DAİRE AY AIDAT"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                        <p className="text-xs text-amber-600 font-medium">⚠️ Önemli Uyarı</p>
                        <p className="text-xs text-amber-600 mt-1">
                          Havale/EFT yaptıktan sonra dekont ile birlikte yönetime bildiriniz. Açıklama kısmına mutlaka
                          blok ve daire numaranızı yazınız.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod === "cash" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Nakit Ödeme</Label>
                      <Card className="bg-muted/30">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <Building className="w-8 h-8 text-primary" />
                            <div>
                              <p className="font-medium">Site Yönetim Ofisi</p>
                              <p className="text-sm text-muted-foreground">A Blok Zemin Kat</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Çalışma Saatleri</p>
                            <p className="text-sm">Hafta içi: 09:00 - 18:00</p>
                            <p className="text-sm">Cumartesi: 10:00 - 14:00</p>
                          </div>
                        </CardContent>
                      </Card>
                      <p className="text-xs text-muted-foreground text-center">
                        Nakit ödeme için lütfen yönetim ofisini ziyaret ediniz
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step: Confirm */}
              {paymentStep === "confirm" && (
                <div className="space-y-4">
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ödeme Yöntemi</span>
                        <span className="font-medium">
                          {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Para Birimi</span>
                        <span className="font-medium">
                          {currencies.find((c) => c.value === selectedCurrency)?.label}
                        </span>
                      </div>
                      
                      {/* Döviz Kuru Bilgisi */}
                      {selectedCurrency !== "TRY" && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-blue-600 font-medium">Döviz Kuru</span>
                            <span className="text-blue-600 font-mono">
                              1 {currencies.find((c) => c.value === selectedCurrency)?.symbol} ={" "}
                              {exchangeRates[selectedCurrency]?.toFixed(4)} ₺
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Aidat (TRY)</span>
                            <span className="font-medium">{formatCurrency(selectedTotal, "TRY")}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Ödenecek ({selectedCurrency})
                            </span>
                            <span className="font-medium">
                              {formatCurrency(totalInSelectedCurrency, selectedCurrency)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {selectedCurrency === "TRY" ? "Aidat Toplamı" : `Aidat (${selectedCurrency})`}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            selectedCurrency === "TRY" ? selectedTotal : totalInSelectedCurrency,
                            selectedCurrency
                          )}
                        </span>
                      </div>

                      {/* Komisyon Bilgisi */}
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-purple-600 font-medium">💼 Sistem Komisyonu</span>
                          <span className="text-purple-600">%{COMPANY_COMMISSION_RATE}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Komisyon Tutarı</span>
                          <span className="font-medium">{formatCurrency(commissionAmount, "TRY")}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Site Alacağı</span>
                          <span className="font-medium text-emerald-600">
                            {formatCurrency(siteReceivesAmount, "TRY")}
                          </span>
                        </div>
                        <div className="text-[10px] text-purple-600 mt-2">
                          ℹ️ Komisyon otomatik olarak {COMPANY_NAME} hesabına aktarılacaktır.
                        </div>
                      </div>

                      {(selectedPaymentMethod === "card" || selectedPaymentMethod === "virtual-pos") &&
                        selectedInstallment > 1 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Taksit Sayısı</span>
                              <span>{selectedInstallment} taksit</span>
                            </div>
                            {installmentFee > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Komisyon (%{installmentFee})</span>
                                <span className="text-amber-500">
                                  {formatCurrency(
                                    (totalInSelectedCurrency * installmentFee) / 100,
                                    selectedCurrency
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="border-t border-border pt-3 flex flex-col gap-2">
                              <div className="flex justify-between">
                                <span className="font-medium">Toplam ({selectedCurrency})</span>
                                <span className="font-bold text-primary">
                                  {formatCurrency(totalWithFee, selectedCurrency)}
                                </span>
                              </div>
                              {selectedCurrency !== "TRY" && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">TL Karşılığı</span>
                                  <span className="text-muted-foreground font-mono">
                                    ≈ {formatCurrency(totalInTRY, "TRY")}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Aylık Taksit</span>
                              <span className="font-semibold">
                                {formatCurrency(totalWithFee / selectedInstallment, selectedCurrency)}
                              </span>
                            </div>
                          </>
                        )}
                      {(selectedPaymentMethod !== "card" && selectedPaymentMethod !== "virtual-pos") ||
                      selectedInstallment === 1 ? (
                        <div className="border-t border-border pt-3 flex flex-col gap-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Toplam ({selectedCurrency})</span>
                            <span className="font-bold text-primary">
                              {formatCurrency(
                                selectedCurrency === "TRY" ? selectedTotal : totalInSelectedCurrency,
                                selectedCurrency
                              )}
                            </span>
                          </div>
                          {selectedCurrency !== "TRY" && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">TL Karşılığı</span>
                              <span className="text-muted-foreground font-mono">
                                ≈ {formatCurrency(selectedTotal, "TRY")}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border shrink-0 space-y-3">
              <div className="flex gap-2">
                {paymentStep !== "method" && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setPaymentStep(paymentStep === "details" ? "method" : "details")}
                  >
                    Geri
                  </Button>
                )}
                <Button
                  className="flex-1 h-12"
                  onClick={() => {
                    if (paymentStep === "method") setPaymentStep("details")
                    else if (paymentStep === "details") setPaymentStep("confirm")
                    else {
                      // Complete payment - call backend
                      handleInitiatePayment()
                    }
                  }}
                >
                  {paymentStep === "confirm" ? (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Ödemeyi Tamamla
                    </>
                  ) : (
                    "Devam Et"
                  )}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">256-bit SSL ile güvenli ödeme</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <div className="p-4 space-y-6 stagger-children">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Toplam Borç"
          value={formatCurrency(totalPending)}
          subtitle={`${dues.filter((d) => d.status !== "paid").length} aidat`}
          icon={CreditCard}
          variant={totalPending > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Ödenen"
          value={formatCurrency(dues.filter((d) => d.status === "paid").reduce((a, b) => a + b.amount, 0))}
          subtitle="Bu yıl"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {role === "resident" && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={() => setShowFinanceModal(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Site Finansal Durumu</p>
                  <p className="text-xs text-muted-foreground">Gelir, gider ve bütçe şeffaflığı</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Quick Pay Button */}
      {role === "resident" && totalPending > 0 && (
        <div className="space-y-2">
          {selectedDues.length > 0 ? (
            <Button className="w-full h-12 text-base font-medium rounded-xl" onClick={handlePaySelected}>
              <CreditCard className="w-5 h-5 mr-2" />
              {selectedDues.length} Aidat Öde ({formatCurrency(selectedTotal)})
            </Button>
          ) : (
            <Button
              className="w-full h-12 text-base font-medium rounded-xl"
              onClick={() => {
                const unpaidIds = dues.filter((d) => d.status !== "paid").map((d) => d.id)
                setSelectedDues(unpaidIds)
                setPaymentStep("method")
                setShowPaymentModal(true)
              }}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Tüm Borçları Öde
            </Button>
          )}
          <p className="text-xs text-center text-muted-foreground">Birden fazla ay seçmek için aidatlara tıklayın</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-10 bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg text-xs">
            Tümü
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg text-xs">
            Bekleyen
          </TabsTrigger>
          <TabsTrigger value="overdue" className="rounded-lg text-xs">
            Gecikmiş
          </TabsTrigger>
          <TabsTrigger value="paid" className="rounded-lg text-xs">
            Ödenen
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-2">
          {filteredDues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
              <p className="text-muted-foreground">Bu kategoride aidat bulunmuyor</p>
            </div>
          ) : (
            filteredDues.map((due) => {
              const StatusIcon = getStatusIcon(due.status)
              const isSelected = selectedDues.includes(due.id)
              const isSelectable = due.status !== "paid" && role === "resident"
              return (
                <motion.div
                  key={due.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-xl bg-card border transition-all",
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-border",
                    isSelectable && "cursor-pointer hover:bg-muted/50",
                  )}
                  onClick={() => isSelectable && toggleDueSelection(due.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {isSelectable && (
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                            isSelected ? "bg-primary border-primary" : "border-muted-foreground/30",
                          )}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                        </div>
                      )}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          getStatusColor(due.status),
                        )}
                      >
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {getMonthName(due.periodMonth)} {due.periodYear}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Son ödeme: {new Date(due.dueDate).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(due.amount, due.currency)}</p>
                      <Badge
                        variant={
                          due.status === "paid" ? "default" : due.status === "overdue" ? "destructive" : "secondary"
                        }
                        className="mt-1"
                      >
                        {getStatusLabel(due.status)}
                      </Badge>
                    </div>
                  </div>
                  {due.status === "paid" && (
                    <Button variant="ghost" size="sm" className="w-full mt-3 h-9 rounded-lg text-muted-foreground">
                      <Download className="w-4 h-4 mr-2" />
                      Makbuz İndir
                    </Button>
                  )}
                  {due.status !== "paid" && role === "resident" && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full mt-3 h-9 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDueForPayment(due)
                        setShowPaymentModalNew(true)
                      }}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Öde
                    </Button>
                  )}
                </motion.div>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      {role === "admin" && (
        <Button className="w-full h-12 rounded-xl" onClick={() => setShowBulkAssignModal(true)}>
          <Users className="w-5 h-5 mr-2" />
          Toplu Aidat Ata
        </Button>
      )}

      {/* Payment Modal */}
      {renderPaymentModal()}

      {/* New Havale/EFT Payment Modal */}
      {selectedDueForPayment && (
        <PaymentModal
          open={showPaymentModalNew}
          onClose={() => {
            setShowPaymentModalNew(false)
            setSelectedDueForPayment(null)
          }}
          dueId={selectedDueForPayment.id}
          amount={selectedDueForPayment.amount}
          siteId={currentSite?.id || "1"}
          onSuccess={loadDues}
        />
      )}

      {/* Finance Modal for Residents */}
      <AnimatePresence>
        {showFinanceModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setShowFinanceModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 max-w-md mx-auto bg-card border border-border rounded-2xl z-50 shadow-xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
            >
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-semibold">Site Finansal Durumu</h2>
                  <p className="text-xs text-muted-foreground">Şeffaf bütçe takibi</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowFinanceModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardContent className="p-3 text-center">
                      <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                      <p className="text-[10px] text-muted-foreground">Gelir</p>
                      <p className="text-sm font-bold text-emerald-500">{formatCurrency(currentReport.income)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-rose-500/10 border-rose-500/20">
                    <CardContent className="p-3 text-center">
                      <TrendingDown className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                      <p className="text-[10px] text-muted-foreground">Gider</p>
                      <p className="text-sm font-bold text-rose-500">{formatCurrency(currentReport.expense)}</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={cn(
                      "border",
                      currentReport.balance >= 0
                        ? "bg-primary/10 border-primary/20"
                        : "bg-amber-500/10 border-amber-500/20",
                    )}
                  >
                    <CardContent className="p-3 text-center">
                      <Wallet
                        className={cn(
                          "w-4 h-4 mx-auto mb-1",
                          currentReport.balance >= 0 ? "text-primary" : "text-amber-500",
                        )}
                      />
                      <p className="text-[10px] text-muted-foreground">Bakiye</p>
                      <p
                        className={cn(
                          "text-sm font-bold",
                          currentReport.balance >= 0 ? "text-primary" : "text-amber-500",
                        )}
                      >
                        {formatCurrency(currentReport.balance)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-3">Gider Dağılımı</h3>
                    <div className="space-y-2">
                      {[
                        { label: "Personel Maaşları", amount: 33000, color: "bg-blue-500" },
                        { label: "Doğalgaz", amount: 22000, color: "bg-orange-500" },
                        { label: "Elektrik", amount: 12500, color: "bg-yellow-500" },
                        { label: "Su", amount: 8200, color: "bg-cyan-500" },
                        { label: "Bakım/Onarım", amount: 15500, color: "bg-purple-500" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", item.color)} />
                          <span className="flex-1 text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-center text-muted-foreground">
                  Detaylı raporlar için yönetim ofisine başvurunuz
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Assign Modal */}
      <AnimatePresence>
        {showBulkAssignModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setShowBulkAssignModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 max-w-md mx-auto bg-card border border-border rounded-2xl z-50 shadow-xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
            >
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-semibold">Toplu Aidat Ata</h2>
                  <p className="text-xs text-muted-foreground">Tüm dairelere tek seferde aidat atayın</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowBulkAssignModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Aidat Tutarı</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0"
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dönem Süresi Seçimi */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Aidat Dönemi</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: "1", label: "1 Ay" },
                      { value: "3", label: "3 Ay" },
                      { value: "6", label: "6 Ay" },
                      { value: "12", label: "1 Yıl" },
                    ].map((period) => (
                      <Button
                        key={period.value}
                        type="button"
                        variant={bulkPeriod === period.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBulkPeriod(period.value)}
                        className={bulkPeriod !== period.value ? "bg-transparent" : ""}
                      >
                        {period.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {bulkPeriod === "1" && "Her ay için ayrı aidat oluşturulacak"}
                    {bulkPeriod === "3" && "3 aylık dönem için aidatlar oluşturulacak"}
                    {bulkPeriod === "6" && "6 aylık dönem için aidatlar oluşturulacak"}
                    {bulkPeriod === "12" && "1 yıllık dönem için aidatlar oluşturulacak"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Başlangıç Dönemi</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={bulkMonth} onValueChange={setBulkMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ay" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m, i) => (
                          <SelectItem key={i} value={(i + 1).toString()}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={bulkYear} onValueChange={setBulkYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Yıl" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2025, 2026, 2027].map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Son Ödeme Günü</Label>
                  <Select value={bulkDueDay} onValueChange={setBulkDueDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 5, 10, 15, 20, 25].map((d) => (
                        <SelectItem key={d} value={d.toString()}>
                          Her ayın {d}. günü
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bank Account Information */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-4 h-4 text-primary" />
                      <Label className="text-sm font-medium">Ödeme Bilgileri</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Banka Adı</Label>
                      <Input
                        placeholder="Örn: Ziraat Bankası"
                        value={bulkBankName}
                        onChange={(e) => setBulkBankName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">IBAN</Label>
                      <Input
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        value={bulkIban}
                        onChange={(e) => setBulkIban(e.target.value)}
                        className="font-mono"
                        maxLength={34}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Hesap Sahibi</Label>
                      <Input
                        placeholder="Örn: Yeşil Vadi Sitesi Yönetimi"
                        value={bulkAccountHolder}
                        onChange={(e) => setBulkAccountHolder(e.target.value)}
                      />
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-3">
                      <p className="text-xs text-amber-600">
                        💡 Bu bilgiler sakinlerin ödeme ekranında görüntülenecektir
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Hariç Tutulacak Bloklar</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {siteBlocks.map((block) => (
                      <Button
                        key={block.id}
                        type="button"
                        variant={excludedBlocks.includes(block.id) ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => {
                          setExcludedBlocks((prev) =>
                            prev.includes(block.id) ? prev.filter((id) => id !== block.id) : [...prev, block.id],
                          )
                        }}
                        className={!excludedBlocks.includes(block.id) ? "bg-transparent" : ""}
                      >
                        {block.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Atanacak Daire Sayısı</span>
                      <span className="font-bold">{totalApartmentsToAssign}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Dönem</span>
                      <span className="font-bold">
                        {bulkPeriod === "1" && "1 Aylık"}
                        {bulkPeriod === "3" && "3 Aylık"}
                        {bulkPeriod === "6" && "6 Aylık"}
                        {bulkPeriod === "12" && "1 Yıllık"}
                      </span>
                    </div>
                    {bulkAmount && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Aylık Aidat</span>
                          <span className="font-medium">{formatCurrency(Number(bulkAmount), selectedCurrency)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Dönem Toplamı (Daire Başı)</span>
                          <span className="font-medium">
                            {formatCurrency(Number(bulkAmount) * Number(bulkPeriod), selectedCurrency)}
                          </span>
                        </div>
                        <div className="border-t border-border pt-2 flex items-center justify-between">
                          <span className="text-muted-foreground font-medium">Toplam Tahakkuk</span>
                          <span className="font-bold text-primary text-lg">
                            {formatCurrency(
                              Number(bulkAmount) * Number(bulkPeriod) * totalApartmentsToAssign,
                              selectedCurrency
                            )}
                          </span>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-purple-600">💼 Sistem Komisyonu (%{COMPANY_COMMISSION_RATE})</span>
                            <span className="font-medium text-purple-600">
                              {formatCurrency(
                                (Number(bulkAmount) * Number(bulkPeriod) * totalApartmentsToAssign *
                                  COMPANY_COMMISSION_RATE) /
                                  100,
                                selectedCurrency
                              )}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 border-t border-border shrink-0">
                <Button
                  className="w-full h-12 text-base font-medium rounded-xl"
                  disabled={
                    !bulkAmount ||
                    totalApartmentsToAssign === 0 ||
                    !bulkBankName ||
                    !bulkIban ||
                    !bulkAccountHolder
                  }
                  onClick={handleBulkAssignment}
                >
                  <Users className="w-5 h-5 mr-2" />
                  {totalApartmentsToAssign} Daireye Aidat Ata
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}


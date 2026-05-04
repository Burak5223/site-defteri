"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Building, Copy, CheckCircle2, Upload, X } from "lucide-react"
import { paymentService, type BankAccount } from "@/lib/services/payment.service"
import { useToast } from "@/hooks/use-toast"

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  dueId: string
  amount: number
  siteId: string
  onSuccess?: () => void
}

export function PaymentModal({ open, onClose, dueId, amount, siteId, onSuccess }: PaymentModalProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadBankAccounts()
    }
  }, [open, siteId])

  const loadBankAccounts = async () => {
    try {
      const accounts = await paymentService.getBankAccounts(siteId)
      setBankAccounts(accounts)
      if (accounts.length > 0) {
        setSelectedBank(accounts[0])
      }
    } catch (error) {
      console.error("Banka hesapları yüklenemedi:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Kopyalandı",
      description: "IBAN numarası panoya kopyalandı",
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!selectedBank) {
      toast({
        title: "Hata",
        description: "Lütfen bir banka hesabı seçin",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Dekont yükleme için file upload endpoint'i eklenecek
      const receiptUrl = receiptFile ? "uploaded-receipt-url" : undefined

      await paymentService.createPayment({
        dueId,
        amount,
        paymentMethod: "havale_eft",
        receiptUrl,
        notes,
      })

      toast({
        title: "Başarılı",
        description: "Ödeme kaydınız oluşturuldu. Yönetici onayından sonra aidat durumunuz güncellenecek.",
      })

      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Ödeme kaydı oluşturulamadı",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const referenceCode = `AIDAT-${dueId.substring(0, 8).toUpperCase()}`

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Havale/EFT ile Ödeme</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tutar Bilgisi */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ödenecek Tutar</span>
                <span className="text-2xl font-bold text-primary">₺{amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Banka Hesap Bilgileri */}
          {selectedBank && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{selectedBank.bankName}</h3>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">IBAN</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={selectedBank.iban} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(selectedBank.iban)}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Hesap Sahibi</Label>
                  <Input value={selectedBank.accountHolder} readOnly className="mt-1" />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Açıklama (Mutlaka Yazınız)</Label>
                  <Input value={referenceCode} readOnly className="mt-1 font-mono bg-amber-50" />
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Havale yaparken açıklama kısmına bu kodu yazınız
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dekont Yükleme */}
          <div className="space-y-2">
            <Label>Dekont Yükle (Opsiyonel)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {receiptFile ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm">{receiptFile.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setReceiptFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Dekont fotoğrafını yüklemek için tıklayın
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Not */}
          <div className="space-y-2">
            <Label>Not (Opsiyonel)</Label>
            <Textarea
              placeholder="Ödeme ile ilgili notunuz..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Uyarı */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800">
                <strong>Önemli:</strong> Havale/EFT yaptıktan sonra bu formu doldurun.
                Ödemeniz yönetici tarafından onaylandıktan sonra aidat durumunuz güncellenecektir.
              </p>
            </CardContent>
          </Card>

          {/* Butonlar */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Kaydediliyor..." : "Ödeme Kaydını Oluştur"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


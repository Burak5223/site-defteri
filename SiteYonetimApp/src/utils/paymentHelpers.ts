/**
 * Ödeme Yardımcı Fonksiyonları
 * Ödeme işlemleri için genel utility fonksiyonlar
 */

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiresApproval: boolean;
  supportsInstallments: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Kredi Kartı',
    icon: '💳',
    description: 'Anında onaylı, taksit seçenekleri',
    requiresApproval: false,
    supportsInstallments: true,
  },
  {
    id: 'transfer',
    name: 'Havale/EFT',
    icon: '🔄',
    description: 'Banka havalesi, yönetici onayı',
    requiresApproval: true,
    supportsInstallments: false,
  },
  {
    id: 'cash',
    name: 'Nakit',
    icon: '💵',
    description: 'Yönetici onayı gerekir',
    requiresApproval: true,
    supportsInstallments: false,
  },
];

export interface PaymentStatus {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
}

export const PAYMENT_STATUSES: { [key: string]: PaymentStatus } = {
  bekliyor: {
    id: 'bekliyor',
    name: 'Bekliyor',
    color: '#f59e0b',
    icon: '⏳',
    description: 'Yönetici onayı bekleniyor',
  },
  tamamlandi: {
    id: 'tamamlandi',
    name: 'Tamamlandı',
    color: '#10b981',
    icon: '✅',
    description: 'Ödeme başarıyla tamamlandı',
  },
  basarisiz: {
    id: 'basarisiz',
    name: 'Başarısız',
    color: '#ef4444',
    icon: '❌',
    description: 'Ödeme reddedildi',
  },
  iptal_edildi: {
    id: 'iptal_edildi',
    name: 'İptal Edildi',
    color: '#6b7280',
    icon: '🚫',
    description: 'Kullanıcı tarafından iptal edildi',
  },
};

/**
 * Ödeme yöntemi bilgisini al
 */
export const getPaymentMethod = (methodId: string): PaymentMethod | undefined => {
  return PAYMENT_METHODS.find(m => m.id === methodId);
};

/**
 * Ödeme durumu bilgisini al
 */
export const getPaymentStatus = (statusId: string): PaymentStatus => {
  return PAYMENT_STATUSES[statusId] || PAYMENT_STATUSES.bekliyor;
};

/**
 * Ödeme yöntemi adını al
 */
export const getPaymentMethodName = (methodId: string): string => {
  const method = getPaymentMethod(methodId);
  return method ? method.name : methodId;
};

/**
 * Ödeme durumu adını al
 */
export const getPaymentStatusName = (statusId: string): string => {
  const status = getPaymentStatus(statusId);
  return status.name;
};

/**
 * Tutar formatla (Türk Lirası)
 */
export const formatAmount = (amount: number): string => {
  return `₺${amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Tarih formatla
 */
export const formatPaymentDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Kısa tarih formatla
 */
export const formatShortDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Dekont numarası oluştur
 */
export const generateReceiptNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `FIS-${timestamp}-${random}`;
};

/**
 * İşlem numarası oluştur
 */
export const generateTransactionId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `TXN-${timestamp}-${random}`;
};

/**
 * Komisyon hesapla
 */
export const calculateCommission = (
  amount: number,
  installment: number = 1
): number => {
  let rate = 0.02; // %2 varsayılan
  
  if (installment === 1) rate = 0.02; // %2
  else if (installment === 3) rate = 0.03; // %3
  else if (installment === 6) rate = 0.04; // %4
  else if (installment === 9) rate = 0.05; // %5
  else if (installment === 12) rate = 0.06; // %6
  
  return Math.round(amount * rate * 100) / 100;
};

/**
 * Toplam tutar hesapla (komisyon dahil)
 */
export const calculateTotalAmount = (
  amount: number,
  installment: number = 1
): number => {
  const commission = calculateCommission(amount, installment);
  return Math.round((amount + commission) * 100) / 100;
};

/**
 * Aylık taksit tutarı hesapla
 */
export const calculateMonthlyAmount = (
  amount: number,
  installment: number
): number => {
  const total = calculateTotalAmount(amount, installment);
  return Math.round((total / installment) * 100) / 100;
};

/**
 * Ödeme özeti oluştur
 */
export const createPaymentSummary = (
  amount: number,
  installment: number = 1
): {
  amount: number;
  commission: number;
  commissionRate: number;
  totalAmount: number;
  monthlyAmount: number;
  installment: number;
} => {
  const commission = calculateCommission(amount, installment);
  const totalAmount = calculateTotalAmount(amount, installment);
  const monthlyAmount = calculateMonthlyAmount(amount, installment);
  
  let commissionRate = 0.02;
  if (installment === 3) commissionRate = 0.03;
  else if (installment === 6) commissionRate = 0.04;
  else if (installment === 9) commissionRate = 0.05;
  else if (installment === 12) commissionRate = 0.06;
  
  return {
    amount,
    commission,
    commissionRate,
    totalAmount,
    monthlyAmount,
    installment,
  };
};

/**
 * IBAN formatla (TR00 0000 0000 0000 0000 0000 00)
 */
export const formatIBAN = (iban: string): string => {
  const cleaned = iban.replace(/\s/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
};

/**
 * IBAN doğrula (basit kontrol)
 */
export const validateIBAN = (iban: string): boolean => {
  const cleaned = iban.replace(/\s/g, '');
  
  // TR ile başlamalı
  if (!cleaned.startsWith('TR')) {
    return false;
  }
  
  // 26 karakter olmalı
  if (cleaned.length !== 26) {
    return false;
  }
  
  return true;
};

/**
 * Banka adını IBAN'dan çıkar (ilk 5 digit)
 */
export const getBankFromIBAN = (iban: string): string => {
  const cleaned = iban.replace(/\s/g, '');
  const bankCode = cleaned.substring(4, 9);
  
  // Türk bankalarının kodları (örnek)
  const banks: { [key: string]: string } = {
    '00001': 'T.C. Merkez Bankası',
    '00010': 'Ziraat Bankası',
    '00012': 'Halk Bankası',
    '00015': 'Vakıfbank',
    '00032': 'Türkiye İş Bankası',
    '00046': 'Akbank',
    '00059': 'Şekerbank',
    '00062': 'Garanti BBVA',
    '00064': 'Türkiye Finans',
    '00067': 'Yapı Kredi',
    '00099': 'ING Bank',
    '00111': 'QNB Finansbank',
    '00123': 'Denizbank',
    '00134': 'Kuveyt Türk',
    '00143': 'Albaraka Türk',
  };
  
  return banks[bankCode] || 'Bilinmeyen Banka';
};

/**
 * Ödeme açıklaması oluştur
 */
export const createPaymentDescription = (
  apartmentNumber: string,
  month?: string,
  year?: number
): string => {
  if (month && year) {
    return `Daire ${apartmentNumber} - ${month}/${year} Aidat`;
  }
  return `Daire ${apartmentNumber} - Aidat Ödemesi`;
};

/**
 * Simüle edilmiş ödeme işlemi (demo için)
 */
export const simulatePaymentProcessing = async (
  duration: number = 2000
): Promise<{ success: boolean; transactionId: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.05; // %95 başarı oranı
      resolve({
        success,
        transactionId: generateTransactionId(),
      });
    }, duration);
  });
};

/**
 * Ödeme yöntemi ikonu al
 */
export const getPaymentMethodIcon = (methodId: string): string => {
  const method = getPaymentMethod(methodId);
  return method ? method.icon : '💰';
};

/**
 * Ödeme durumu rengi al
 */
export const getPaymentStatusColor = (statusId: string): string => {
  const status = getPaymentStatus(statusId);
  return status.color;
};

/**
 * Ödeme durumu ikonu al
 */
export const getPaymentStatusIcon = (statusId: string): string => {
  const status = getPaymentStatus(statusId);
  return status.icon;
};

/**
 * Ödeme yapılabilir mi kontrol et
 */
export const canMakePayment = (dueStatus: string): boolean => {
  const unpaidStatuses = ['bekliyor', 'pending', 'gecikti', 'overdue'];
  return unpaidStatuses.includes(dueStatus.toLowerCase());
};

/**
 * Ödeme iptal edilebilir mi kontrol et
 */
export const canCancelPayment = (paymentStatus: string): boolean => {
  return paymentStatus.toLowerCase() === 'bekliyor';
};

/**
 * Taksit metni oluştur
 */
export const getInstallmentText = (installment: number): string => {
  if (installment === 1) {
    return 'Tek Çekim';
  }
  return `${installment} Taksit`;
};

/**
 * Komisyon oranı metni
 */
export const getCommissionRateText = (installment: number): string => {
  let rate = 2;
  if (installment === 3) rate = 3;
  else if (installment === 6) rate = 4;
  else if (installment === 9) rate = 5;
  else if (installment === 12) rate = 6;
  
  return `%${rate} komisyon`;
};

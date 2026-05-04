/**
 * Kart Validasyon Utility Fonksiyonları
 * Demo amaçlı ama gerçekçi validasyonlar
 */

export interface CardType {
  name: string;
  pattern: RegExp;
  cvvLength: number;
  icon: string;
}

export const CARD_TYPES: CardType[] = [
  {
    name: 'Visa',
    pattern: /^4/,
    cvvLength: 3,
    icon: '💳',
  },
  {
    name: 'Mastercard',
    pattern: /^5[1-5]/,
    cvvLength: 3,
    icon: '💳',
  },
  {
    name: 'American Express',
    pattern: /^3[47]/,
    cvvLength: 4,
    icon: '💳',
  },
  {
    name: 'Troy',
    pattern: /^9792/,
    cvvLength: 3,
    icon: '💳',
  },
];

/**
 * Luhn algoritması ile kart numarası doğrulama
 * @param cardNumber - Kart numarası (sadece rakamlar)
 * @returns boolean - Geçerli mi?
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  // Sadece rakamları al
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Minimum 13, maksimum 19 hane
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  // Luhn algoritması
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Kart tipini tespit et
 * @param cardNumber - Kart numarası
 * @returns CardType | null
 */
export const detectCardType = (cardNumber: string): CardType | null => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  for (const cardType of CARD_TYPES) {
    if (cardType.pattern.test(cleaned)) {
      return cardType;
    }
  }
  
  return null;
};

/**
 * CVV doğrulama
 * @param cvv - CVV kodu
 * @param cardType - Kart tipi (opsiyonel)
 * @returns boolean
 */
export const validateCVV = (cvv: string, cardType?: CardType | null): boolean => {
  const cleaned = cvv.replace(/\D/g, '');
  
  if (cardType) {
    return cleaned.length === cardType.cvvLength;
  }
  
  // Genel kontrol: 3 veya 4 hane
  return cleaned.length === 3 || cleaned.length === 4;
};

/**
 * Son kullanma tarihi doğrulama
 * @param month - Ay (1-12)
 * @param year - Yıl (YY veya YYYY)
 * @returns boolean
 */
export const validateExpiryDate = (month: string, year: string): boolean => {
  const monthNum = parseInt(month, 10);
  let yearNum = parseInt(year, 10);
  
  // Ay kontrolü
  if (monthNum < 1 || monthNum > 12) {
    return false;
  }
  
  // Yıl formatı düzeltme (YY -> YYYY)
  if (yearNum < 100) {
    yearNum += 2000;
  }
  
  // Geçmiş tarih kontrolü
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (yearNum < currentYear) {
    return false;
  }
  
  if (yearNum === currentYear && monthNum < currentMonth) {
    return false;
  }
  
  // Çok ileri tarih kontrolü (10 yıldan fazla)
  if (yearNum > currentYear + 10) {
    return false;
  }
  
  return true;
};

/**
 * Kart numarasını formatla (1234 5678 9012 3456)
 * @param cardNumber - Kart numarası
 * @returns string - Formatlanmış kart numarası
 */
export const formatCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
};

/**
 * Kart numarasını maskele (1234 **** **** 5678)
 * @param cardNumber - Kart numarası
 * @returns string - Maskelenmiş kart numarası
 */
export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 8) {
    return cleaned;
  }
  
  const first4 = cleaned.substring(0, 4);
  const last4 = cleaned.substring(cleaned.length - 4);
  const middle = '*'.repeat(cleaned.length - 8);
  
  return formatCardNumber(first4 + middle + last4);
};

/**
 * Son kullanma tarihini formatla (MM/YY)
 * @param value - Girilen değer
 * @returns string - Formatlanmış tarih
 */
export const formatExpiryDate = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
  }
  
  return cleaned;
};

/**
 * Taksit seçeneklerini hesapla
 * @param amount - Tutar
 * @param maxInstallments - Maksimum taksit sayısı
 * @returns Array<{installment: number, amount: number, total: number, commission: number}>
 */
export const calculateInstallments = (
  amount: number,
  maxInstallments: number = 12
): Array<{
  installment: number;
  monthlyAmount: number;
  totalAmount: number;
  commission: number;
  commissionRate: number;
}> => {
  const installments = [1, 3, 6, 9, 12].filter(i => i <= maxInstallments);
  
  return installments.map(installment => {
    // Komisyon oranları (taksit sayısına göre)
    let commissionRate = 0;
    if (installment === 1) commissionRate = 0.02; // %2
    else if (installment === 3) commissionRate = 0.03; // %3
    else if (installment === 6) commissionRate = 0.04; // %4
    else if (installment === 9) commissionRate = 0.05; // %5
    else if (installment === 12) commissionRate = 0.06; // %6
    
    const commission = amount * commissionRate;
    const totalAmount = amount + commission;
    const monthlyAmount = totalAmount / installment;
    
    return {
      installment,
      monthlyAmount: Math.round(monthlyAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      commission: Math.round(commission * 100) / 100,
      commissionRate,
    };
  });
};

/**
 * Test kart numaraları (demo için)
 */
export const TEST_CARDS = {
  visa: '4111111111111111',
  mastercard: '5500000000000004',
  amex: '340000000000009',
  troy: '9792030000000000',
};

/**
 * Kart bilgilerini doğrula (tümü)
 * @param cardNumber - Kart numarası
 * @param cvv - CVV
 * @param month - Ay
 * @param year - Yıl
 * @returns {valid: boolean, errors: string[]}
 */
export const validateCard = (
  cardNumber: string,
  cvv: string,
  month: string,
  year: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!validateCardNumber(cardNumber)) {
    errors.push('Geçersiz kart numarası');
  }
  
  const cardType = detectCardType(cardNumber);
  if (!validateCVV(cvv, cardType)) {
    errors.push('Geçersiz CVV');
  }
  
  if (!validateExpiryDate(month, year)) {
    errors.push('Geçersiz son kullanma tarihi');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

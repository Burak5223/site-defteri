import { apiClient } from '../api/apiClient';

export interface PaymentRequest {
  dueId: string;
  dueIds?: string[];
  amount: number;
  systemCommissionAmount?: number;
  currencyCode: string;
  installment: number;
  paymentMethod: string;
  cardInfo?: {
    cardName: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvv: string;
  };
  receiptUrl?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  dueId: string;
  amount: number;
  currencyCode: string;
  status: string;
  paymentMethod: string;
  installmentCount?: number;
  receiptNumber?: string;
  receiptUrl?: string;
  paymentDate?: string;
  createdAt: string;
  userName?: string; // Kullanıcı adı soyadı
  apartmentNumber?: string; // Daire numarası
  notes?: string;
}

export interface BankAccount {
  id?: string;
  siteId: string;
  bankName: string;
  branch?: string;
  iban: string;
  accountHolder: string;
  isActive: boolean;
}

class PaymentService {
  private baseUrl = '/payments';

  async processPayment(request: PaymentRequest): Promise<Payment> {
    const payload = {
      dueId: request.dueId,
      dueIds: request.dueIds,
      amount: request.amount,
      systemCommissionAmount: request.systemCommissionAmount,
      currencyCode: request.currencyCode,
      installment: request.installment,
      paymentMethod: request.paymentMethod,
      cardInfo: request.cardInfo,
      receiptUrl: request.receiptUrl,
      notes: request.notes,
    };
    
    return apiClient.post(`${this.baseUrl}/process`, payload);
  }

  async getMyPayments(): Promise<Payment[]> {
    return apiClient.get(`${this.baseUrl}/my-payments`);
  }

  async getPaymentById(id: string): Promise<Payment> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  async cancelPayment(id: string): Promise<Payment> {
    return apiClient.post(`${this.baseUrl}/${id}/cancel`);
  }

  async getSiteBankAccount(siteId: string): Promise<BankAccount> {
    const response = await apiClient.get(`/sites/${siteId}/bank-accounts`) as any;
    // Backend returns array, get first one
    return Array.isArray(response) ? response[0] : response;
  }

  async getPendingPayments(siteId: string): Promise<Payment[]> {
    return apiClient.get(`/sites/${siteId}/payments/pending`);
  }

  async approvePayment(paymentId: string): Promise<Payment> {
    return apiClient.put(`/payments/${paymentId}/approve`);
  }

  async rejectPayment(paymentId: string, reason: string): Promise<Payment> {
    return apiClient.put(`/payments/${paymentId}/reject?reason=${encodeURIComponent(reason)}`);
  }
}

export const paymentService = new PaymentService();

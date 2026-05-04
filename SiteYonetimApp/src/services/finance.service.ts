import { apiClient } from '../api/apiClient';

export interface Income {
  id: string;
  description: string;
  amount: number;
  category: string;
  incomeDate: string;
  paymentMethod?: string;
  receiptNumber?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  paymentMethod?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

class FinanceService {
  async getIncomes(siteId: string): Promise<Income[]> {
    return apiClient.get(`/sites/${siteId}/incomes`);
  }

  async createIncome(siteId: string, data: Omit<Income, 'id'>): Promise<Income> {
    return apiClient.post(`/sites/${siteId}/incomes`, data);
  }

  async getExpenses(siteId: string): Promise<Expense[]> {
    return apiClient.get(`/sites/${siteId}/expenses`);
  }

  async createExpense(siteId: string, data: Omit<Expense, 'id'>): Promise<Expense> {
    return apiClient.post(`/sites/${siteId}/expenses`, data);
  }

  async getFinancialSummary(siteId: string): Promise<FinancialSummary> {
    return apiClient.get(`/sites/${siteId}/dashboard/financial-summary`);
  }
}

export const financeService = new FinanceService();

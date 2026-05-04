import apiClient from '../api/apiClient';

export interface CurrencyRate {
  currency: string;
  symbol: string;
  rate: number;
  lastUpdate: string;
}

class CurrencyService {
  async getCurrentRates(): Promise<CurrencyRate[]> {
    const response = await apiClient.get<CurrencyRate[]>('/currency/rates');
    console.log('Currency API raw response:', response);
    // apiClient.get zaten response.data döndürüyor, tekrar .data demeye gerek yok
    return response;
  }
}

export const currencyService = new CurrencyService();

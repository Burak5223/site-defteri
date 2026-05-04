/**
 * Language Service
 * Backend ile dil tercihlerini senkronize eder
 */

import { apiClient } from '../api/apiClient';

export interface LanguageResponse {
  language: 'tr' | 'en' | 'ru' | 'ar';
}

export interface UpdateLanguageResponse {
  status: string;
  message: string;
  language: string;
}

class LanguageService {
  /**
   * Get user's preferred language from backend
   * GET /api/users/me/language
   */
  async getUserLanguage(): Promise<LanguageResponse> {
    return apiClient.get<LanguageResponse>('/users/me/language');
  }

  /**
   * Update user's preferred language on backend
   * PUT /api/users/me/language
   */
  async updateUserLanguage(language: 'tr' | 'en' | 'ru' | 'ar'): Promise<UpdateLanguageResponse> {
    return apiClient.put<UpdateLanguageResponse>('/users/me/language', { language });
  }

  /**
   * Sync language between AsyncStorage and Backend
   * Called on app startup and after login
   */
  async syncLanguage(localLanguage: 'tr' | 'en' | 'ru' | 'ar'): Promise<'tr' | 'en' | 'ru' | 'ar'> {
    try {
      // Get backend language
      const backendLang = await this.getUserLanguage();
      
      // If different, use backend language (server is source of truth)
      if (backendLang.language !== localLanguage) {
        console.log(`Language sync: Local=${localLanguage}, Backend=${backendLang.language}, Using backend`);
        return backendLang.language;
      }
      
      return localLanguage;
    } catch (error) {
      console.error('Language sync error:', error);
      // If backend fails, use local language
      return localLanguage;
    }
  }

  /**
   * Save language to both AsyncStorage and Backend
   * Called when user changes language in settings
   */
  async saveLanguage(language: 'tr' | 'en' | 'ru' | 'ar'): Promise<void> {
    try {
      // Update backend
      await this.updateUserLanguage(language);
      console.log(`Language saved to backend: ${language}`);
    } catch (error) {
      console.error('Failed to save language to backend:', error);
      // Don't throw - AsyncStorage will still work
    }
  }
}

export const languageService = new LanguageService();

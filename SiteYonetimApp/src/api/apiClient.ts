import AsyncStorage from '@react-native-async-storage/async-storage';

// Railway Production URL
const RAILWAY_URL = 'https://site-yonetim-production.up.railway.app/api';

// Dinamik IP - geliştirme sırasında değiştirilebilir
const BACKEND_IPS = [
  '172.29.1.55',     // Ana Sunucu IP (Eduroam ağında) - PRIMARY
  '10.60.24.246',    // Windows PC IP - BACKUP
  '192.168.137.1',   // Hotspot IP - BACKUP
  '192.168.70.211',  // Local Wi-Fi IP - BACKUP
];

const API_BASE_URL = __DEV__ 
  ? `http://${BACKEND_IPS[0]}:8080/api`  // Development - Local
  : RAILWAY_URL;  // Production - Railway

interface RequestConfig {
  headers?: Record<string, string>;
  body?: any;
}

class ApiClient {
  private async request<T>(
    url: string,
    method: string,
    data?: any,
    config?: RequestConfig,
    retryCount: number = 0
  ): Promise<T> {
    const token = await AsyncStorage.getItem('accessToken');
    
    // İlk denemede ana IP, sonraki denemelerde alternatif IP'leri kullan
    let baseUrl = API_BASE_URL;
    if (retryCount > 0 && retryCount < BACKEND_IPS.length) {
      baseUrl = `http://${BACKEND_IPS[retryCount]}:8080/api`;
    }
    
    const fullUrl = `${baseUrl}${url}`;

    console.log(`API Request: ${method} ${url} (attempt ${retryCount + 1}) - IP: ${BACKEND_IPS[retryCount] || BACKEND_IPS[0]}`);
    console.log(`🎯 Trying IP: ${baseUrl}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
      console.log(`API Request Body:`, JSON.stringify(data, null, 2));
    }

    try {
      console.log(`🚀 API Request starting: ${method} ${fullUrl}`);
      
      // AI cargo photo upload için özel timeout (30 saniye), diğerleri için 20 saniye
      const isAICargoUpload = url.includes('/packages/upload-cargo-photo');
      const timeoutDuration = isAICargoUpload ? 30000 : 20000;
      
      if (isAICargoUpload) {
        console.log(`⏱️ AI Cargo Upload detected - using extended timeout: ${timeoutDuration}ms`);
      }
      
      // Timeout için Promise.race kullan
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutDuration)
      );

      const response = await Promise.race([
        fetch(fullUrl, options),
        timeoutPromise
      ]) as Response;

      console.log(`📡 Response received: ${response.status} ${response.statusText}`);

      if (response.status === 401) {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              await AsyncStorage.setItem('accessToken', refreshData.accessToken);
              await AsyncStorage.setItem('refreshToken', refreshData.refreshToken);

              headers.Authorization = `Bearer ${refreshData.accessToken}`;
              const retryResponse = await fetch(fullUrl, { ...options, headers });
              
              if (!retryResponse.ok) {
                throw new Error(`HTTP ${retryResponse.status}`);
              }
              
              // Content-Type kontrolü
              const retryContentType = retryResponse.headers.get('content-type');
              if (!retryContentType || !retryContentType.includes('application/json')) {
                const text = await retryResponse.text();
                if (!text || text.trim() === '') return null as any;
                try {
                  return JSON.parse(text);
                } catch (e) {
                  return text as any;
                }
              }
              
              return await retryResponse.json();
            }
          } catch (refreshError) {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
            throw refreshError;
          }
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorText = await response.text();
          // 403 hatalarını sessizce yakala (yetki hatası - normal durum)
          if (response.status !== 403) {
            console.error(`API Error ${url}:`, errorText);
          }
          errorMessage = `${errorMessage}: ${errorText}`;
        } catch (e) {
          if (response.status !== 403) {
            console.error(`API Error ${url}: Could not read error response`);
          }
        }
        throw new Error(errorMessage);
      }

      // Content-Type kontrolü yap
      const contentType = response.headers.get('content-type');
      
      // Eğer JSON değilse veya boş response ise
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        // Boş response ise null dön
        if (!text || text.trim() === '') {
          return null as any;
        }
        // JSON parse etmeyi dene
        try {
          return JSON.parse(text);
        } catch (e) {
          console.warn(`Non-JSON response from ${url}:`, text);
          return text as any;
        }
      }

      // JSON response
      const responseText = await response.text();
      return responseText ? JSON.parse(responseText) : (null as any);
    } catch (error) {
      console.error(`❌ API Error ${url} (attempt ${retryCount + 1}):`, error);
      
      // Retry logic - farklı IP'leri dene
      if (retryCount < BACKEND_IPS.length - 1 && error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Network') || error.message.includes('fetch')) {
          console.log(`🔄 Retrying with different IP... (${retryCount + 2}/${BACKEND_IPS.length})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.request(url, method, data, config, retryCount + 1);
        }
      }
      
      // 403 hatalarını sessizce yakala
      if (error instanceof Error && !error.message.includes('HTTP 403')) {
        console.error(`API Error ${url}:`, error);
      }
      throw error;
    }
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, 'GET', undefined, config);
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, 'POST', data, config);
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, 'PUT', data, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, 'DELETE', undefined, config);
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, 'PATCH', data, config);
  }
}

export const apiClient = new ApiClient();
export default apiClient;

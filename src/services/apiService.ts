// Common API Service Implementation
import toast from 'react-hot-toast';

// Environment Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

// Common API Response Interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Helper Functions
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const redirectToLogin = () => {
  // React Router kullanıyoruz, bu yüzden window.location kullanıyoruz
  window.location.href = '/login';
};

// Enhanced API Helper function with comprehensive error handling
const apiCall = async <T = any>(
  endpoint: string, 
  options: RequestInit = {},
  showToast: boolean = true
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Token varsa Authorization header'ına ekle
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const defaultOptions: RequestInit = {
    headers,
    signal: AbortSignal.timeout(API_TIMEOUT),
  };

  const config = { ...defaultOptions, ...options };

  try {
    console.log('API Request:', url, config);
    const response = await fetch(url, config);
    
    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    console.log('API Response Status:', response.status, response.statusText);

    // 401 Unauthorized - Oturum süresi dolmuş veya geçersiz token
    if (response.status === 401) {
      console.log('401 Unauthorized - Oturum temizleniyor ve login sayfasına yönlendiriliyor');
      clearAuthData();
      if (showToast) {
        toast.error('Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.');
      }
      // Küçük bir gecikme ile yönlendirme
      setTimeout(() => {
        redirectToLogin();
      }, 1000);
      
      return {
        success: false,
        error: 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.'
      };
    }

    // 400 Bad Request - İstek hatası
    if (response.status === 400) {
      const errorMessage = data.message || data.error || 'Geçersiz istek. Lütfen girdiğiniz bilgileri kontrol edin.';
      if (showToast) {
        toast.error(errorMessage);
      }
      return {
        success: false,
        error: errorMessage
      };
    }

    // 403 Forbidden
    if (response.status === 403) {
      const errorMessage = data.message || data.error || 'Bu işlem için yetkiniz bulunmuyor.';
      if (showToast) {
        toast.error(errorMessage);
      }
      return {
        success: false,
        error: errorMessage
      };
    }

    // 404 Not Found
    if (response.status === 404) {
      const errorMessage = data.message || data.error || 'Aradığınız kaynak bulunamadı.';
      if (showToast) {
        toast.error(errorMessage);
      }
      return {
        success: false,
        error: errorMessage
      };
    }

    // 409 Conflict
    if (response.status === 409) {
      const errorMessage = data.message || data.error || 'Bir çakışma oluştu. Bu kaynak zaten mevcut.';
      if (showToast) {
        toast.error(errorMessage);
      }
      return {
        success: false,
        error: errorMessage
      };
    }

    // 500 Internal Server Error
    if (response.status >= 500) {
      const errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      if (showToast) {
        toast.error(errorMessage);
      }
      return {
        success: false,
        error: errorMessage
      };
    }

    // Diğer HTTP hataları
    if (!response.ok) {
      const errorMessage = data.message || data.error || `HTTP ${response.status}: Bir hata oluştu`;
      if (showToast) {
        toast.error(errorMessage);
      }
      return {
        success: false,
        error: errorMessage
      };
    }

    // Başarılı yanıt
    return {
      success: true,
      ...data
    };

  } catch (error) {
    console.error('API çağrısı hatası:', error);

    let errorMessage = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';

    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Sunucuya bağlanılamıyor. Backend servisinin çalıştığından emin olun.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'İstek iptal edildi.';
      }
    }

    if (showToast) {
      toast.error(errorMessage);
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

// Common API Service
export const apiService = {
  // GET request
  get: <T = any>(endpoint: string, showToast: boolean = true): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'GET' }, showToast);
  },

  // POST request
  post: <T = any>(endpoint: string, data?: any, showToast: boolean = true): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, showToast);
  },

  // PUT request
  put: <T = any>(endpoint: string, data?: any, showToast: boolean = true): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, showToast);
  },

  // DELETE request
  delete: <T = any>(endpoint: string, showToast: boolean = true): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'DELETE' }, showToast);
  },

  // PATCH request
  patch: <T = any>(endpoint: string, data?: any, showToast: boolean = true): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, showToast);
  },

  // Custom request with full control
  custom: <T = any>(endpoint: string, options: RequestInit, showToast: boolean = true): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, options, showToast);
  }
};

// Toast utilities
export const showSuccessToast = (message: string) => {
  toast.success(message);
};

export const showErrorToast = (message: string) => {
  toast.error(message);
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

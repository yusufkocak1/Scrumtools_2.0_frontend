// Auth Service API Documentation

// Login API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user:User;
    token: string;
  };
  error?: string;
}

// Signup API
export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  success: boolean;
  data?: {
    user:User;
    token: string;
  };
  error?: string;
}

// Logout API
export interface LogoutResponse {
  success: boolean;
  message?: string;
}

// User Profile API
export interface UserProfileResponse {
  success: boolean;
  data?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}
export type User = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    preferences:Map<string, string>;
}

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

// API Helper function
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(API_TIMEOUT), // Request timeout
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Bir hata oluştu'
      };
    }
    console.log('API çağrısı başarılı:', { url, options, data });

    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error('API çağrısı hatası:', error);

    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return {
          success: false,
          error: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.'
        };
      }
      if (error.name === 'TypeError') {
        return {
          success: false,
          error: 'Sunucuya bağlanılamıyor. Backend servisinin çalıştığından emin olun.'
        };
      }
    }

    return {
      success: false,
      error: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
    };
  }
};

// Auth Service Implementation
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  signup: async (userData: SignupRequest): Promise<SignupResponse> => {
    return apiCall('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async (): Promise<LogoutResponse> => {
    const token = localStorage.getItem('token');

    const result = await apiCall('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    // Başarılı olsun ya da olmasın token'ı temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    return result;
  },

  getUserProfile: async (): Promise<UserProfileResponse> => {
    const token = localStorage.getItem('token');

    if (!token) {
      return {
        success: false,
        error: 'Token bulunamadı'
      };
    }

    return apiCall('/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Kullanıcının giriş yapıp yapmadığını kontrol et
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Token ve user bilgilerini localStorage'dan al
  getAuthData: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    const user = userStr ? JSON.parse(userStr) : null;

    return { token, user };
  },

  // Token ve user bilgilerini localStorage'a kaydet
  setAuthData: (token: string, user: User) => {
    console.log('Saving auth data:', { token, user });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Auth verilerini temizle
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

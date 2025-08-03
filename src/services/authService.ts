// Auth Service API Documentation
import { apiService } from './apiService';

// Login API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
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
    user: User;
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
  preferences: Map<string, string>;
}

// Auth Service Implementation
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiService.post<LoginResponse['data']>('/api/auth/login', credentials);
  },

  signup: async (userData: SignupRequest): Promise<SignupResponse> => {
    return apiService.post<SignupResponse['data']>('/api/auth/signup', userData);
  },

  logout: async (): Promise<LogoutResponse> => {
    // @ts-ignore
    const result = await apiService.post<LogoutResponse['data']>('/api/auth/logout');

    // Başarılı olsun ya da olmasın token'ı temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    return result;
  },

  getUserProfile: async (): Promise<UserProfileResponse> => {
    return apiService.get<UserProfileResponse['data']>('/api/auth/profile');
  },

  // Token kontrolü
  isTokenValid: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Kullanıcının kimlik doğrulaması yapılmış mı kontrol et
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Auth verilerini getir
  getAuthData: (): { user: User | null; token: string | null } => {
    const token = localStorage.getItem('token');
    const user = authService.getCurrentUser();
    return { user, token };
  },

  // Auth verilerini kaydet (login sonrası)
  setAuthData: (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Kullanıcı bilgilerini localStorage'dan getir
  getCurrentUser: (): User | null => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Kullanıcı bilgilerini localStorage'a kaydet
  setCurrentUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Token'ı localStorage'a kaydet
  setToken: (token: string) => {
    localStorage.setItem('token', token);
  }
};

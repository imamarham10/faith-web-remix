import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '../services/api';
import axios from 'axios';
import { ENV } from '../utils/env';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<void>;
  loginWithOTP: (email: string, otp: string) => Promise<void>;
  requestOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip auth check during SSR — localStorage doesn't exist on the server
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authAPI.getProfile();
        setUser(response.data?.data || response.data?.user || response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          // Access token expired — try refreshing before giving up
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const refreshRes = await axios.post(`${ENV.API_BASE_URL}/auth/refresh`, {
                refresh_token: refreshToken,
              });
              const resData = refreshRes.data?.data || refreshRes.data;
              const newAccessToken = resData.accessToken || resData.access_token;
              const newRefreshToken = resData.refreshToken || resData.refresh_token;

              if (newAccessToken) {
                localStorage.setItem('accessToken', newAccessToken);
              }
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }

              // Retry profile fetch with new token
              if (newAccessToken) {
                const retryRes = await authAPI.getProfile();
                setUser(retryRes.data?.data || retryRes.data?.user || retryRes.data);
              }
            } catch {
              // Refresh also failed — tokens are truly invalid
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          } else {
            // No refresh token available — clear access token
            localStorage.removeItem('accessToken');
          }
        }
        // For network/server errors, keep tokens and allow retry on next navigation
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const data: any = response.data?.data || response.data;

    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(data.user);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    const response = await authAPI.register(email, password, firstName, lastName, phone);
    const data: any = response.data?.data || response.data;

    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(data.user);
  };

  const requestOTP = async (email: string) => {
    await authAPI.requestOTP(email);
  };

  const loginWithOTP = async (email: string, otp: string) => {
    const response = await authAPI.verifyOTP(email, otp);
    const data: any = response.data?.data || response.data;

    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(data.user);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authAPI.logout(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    clearAuth();
  };

  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  // Listen for token clearing events from axios interceptor
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      // If tokens are cleared in localStorage, sync the auth context
      if ((e.key === 'accessToken' || e.key === 'refreshToken') && e.newValue === null) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithOTP,
        requestOTP,
        logout,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

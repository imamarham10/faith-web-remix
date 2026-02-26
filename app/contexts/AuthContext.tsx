import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '../services/api';
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
    const checkAuth = async () => {
      try {
        const response = await authAPI.validateToken();
        setUser(response.data?.data || response.data?.user || response.data);
      } catch {
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const data: any = response.data?.data || response.data;
    setUser(data.user);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    const response = await authAPI.register(email, password, firstName, lastName, phone);
    const data: any = response.data?.data || response.data;
    setUser(data.user);
  };

  const requestOTP = async (email: string) => {
    await authAPI.requestOTP(email);
  };

  const loginWithOTP = async (email: string, otp: string) => {
    const response = await authAPI.verifyOTP(email, otp);
    const data: any = response.data?.data || response.data;
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }

    clearAuth();
  };

  const clearAuth = () => {
    setUser(null);
  };

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

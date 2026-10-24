import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import {
  setAuthHeader,
  requestOtp as apiRequestOtp,
  verifyOtp as apiVerifyOtp,
  getProfile,
  loadSavedApiBaseUrl,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  requestOtp: (phone: string) => Promise<{ success: boolean; message: string; devMockOtp?: string }>;
  login: (phone: string, otp: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkPersistedAuth();
  }, []);

  const checkPersistedAuth = async () => {
    try {
      await loadSavedApiBaseUrl();
      const storedToken = await AsyncStorage.getItem('@miniledger_token');
      if (storedToken) {
        setAuthHeader(storedToken);
        const profile = await getProfile();
        setUser(profile);
        setToken(storedToken);
      }
    } catch {
      // If token is invalid or expired, clear it
      await AsyncStorage.removeItem('@miniledger_token');
      setAuthHeader(null);
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = async (phone: string) => {
    return await apiRequestOtp(phone);
  };

  const login = async (phone: string, otp: string, name?: string) => {
    const { user: loggedInUser, token: authToken } = await apiVerifyOtp(phone, otp, name);
    setUser(loggedInUser);
    setToken(authToken);
    await AsyncStorage.setItem('@miniledger_token', authToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setAuthHeader(null);
    await AsyncStorage.removeItem('@miniledger_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        requestOtp,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

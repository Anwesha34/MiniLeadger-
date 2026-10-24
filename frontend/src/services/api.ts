import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Loan, LoanFilter, LoanSummary, User } from '../types';

// Default backend URL based on execution platform
export const getDefaultBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    // Android emulator loops back to host machine on 10.0.2.2
    return 'http://10.0.2.2:5000/api';
  }
  // Web, iOS Simulator, or default local
  return 'http://localhost:5000/api';
};

let currentBaseUrl = getDefaultBaseUrl();

export const api: AxiosInstance = axios.create({
  baseURL: currentBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function setApiBaseUrl(newUrl: string): Promise<void> {
  currentBaseUrl = newUrl;
  api.defaults.baseURL = newUrl;
  await AsyncStorage.setItem('@miniledger_api_url', newUrl);
}

export async function loadSavedApiBaseUrl(): Promise<string> {
  const saved = await AsyncStorage.getItem('@miniledger_api_url');
  if (saved) {
    currentBaseUrl = saved;
    api.defaults.baseURL = saved;
    return saved;
  }
  return getDefaultBaseUrl();
}

export function setAuthHeader(token: string | null): void {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// ---------------- API Methods ----------------

export async function requestOtp(phone: string): Promise<{
  success: boolean;
  message: string;
  devMockOtp?: string;
}> {
  const res = await api.post('/auth/send-otp', { phone });
  return {
    success: res.data.success,
    message: res.data.message,
    devMockOtp: res.data.data?.devMockOtp,
  };
}

export async function verifyOtp(
  phone: string,
  otp: string,
  name?: string
): Promise<{ user: User; token: string }> {
  const res = await api.post('/auth/verify-otp', { phone, otp, name });
  const { user, token } = res.data.data;
  setAuthHeader(token);
  return { user, token };
}

export async function getProfile(): Promise<User> {
  const res = await api.get('/auth/me');
  return res.data.data.user;
}

export async function getSummary(): Promise<LoanSummary> {
  const res = await api.get('/loans/summary');
  return res.data.data.summary;
}

export async function getLoans(filter?: LoanFilter, search?: string): Promise<Loan[]> {
  const params: Record<string, string> = {};
  if (filter && filter !== 'all') params.status = filter;
  if (search && search.trim()) params.search = search.trim();

  const res = await api.get('/loans', { params });
  return res.data.data.loans;
}

export async function createLoan(data: {
  friendName: string;
  amount: number;
  dueDate: string;
  notes?: string;
  receiptUrl?: string;
}): Promise<Loan> {
  const res = await api.post('/loans', data);
  return res.data.data.loan;
}

export async function markAsRepaid(loanId: string): Promise<Loan> {
  const res = await api.patch(`/loans/${loanId}/repay`);
  return res.data.data.loan;
}

export async function deleteLoan(loanId: string): Promise<void> {
  await api.delete(`/loans/${loanId}`);
}

export async function uploadReceiptPhoto(imageUri: string): Promise<string> {
  const formData = new FormData();

  const filename = imageUri.split('/').pop() || 'receipt.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  // React Native file payload format for multipart/form-data
  // @ts-ignore
  formData.append('receipt', {
    uri: imageUri,
    name: filename,
    type,
  });

  const res = await api.post('/loans/upload-receipt', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data.data.url;
}

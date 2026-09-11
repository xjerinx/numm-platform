import { create } from 'zustand';
import apiClient from '../api/client';

export type Role = 'SUPER_ADMIN' | 'CPSE_ANALYST' | 'REVIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  cpseCode?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  quickSwitchRole: (role: Role, email: string, cpseCode?: string | null) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('numm_user') || 'null'),
  token: localStorage.getItem('numm_token') || null,
  isAuthenticated: !!localStorage.getItem('numm_token'),
  isLoading: false,

  login: async (email: string, password = 'Admin@1234') => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('numm_token', token);
      localStorage.setItem('numm_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err) {
      set({ isLoading: false });
      return false;
    }
  },

  quickSwitchRole: async (role: Role, email: string, cpseCode = null) => {
    // Password mapping for quick demo switcher
    const passMap: Record<string, string> = {
      'admin@numm.gov.in': 'Admin@1234',
      'analyst@ongc.in': 'Analyst@1234',
      'reviewer@numm.gov.in': 'Review@1234',
    };
    const password = passMap[email] || 'Admin@1234';
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('numm_token', token);
      localStorage.setItem('numm_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    } catch (e) {
      console.error('Quick switch failed:', e);
    }
  },

  logout: () => {
    localStorage.removeItem('numm_token');
    localStorage.removeItem('numm_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('numm_token');
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    try {
      const res = await apiClient.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('numm_token');
      localStorage.removeItem('numm_user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));

import { create } from 'zustand';

interface AuthState {
  adminToken: string | null;
  adminEmail: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, email: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  adminToken: localStorage.getItem('adminToken') || null,
  adminEmail: localStorage.getItem('adminEmail') || null,
  isAuthenticated: !!localStorage.getItem('adminToken'),

  setAuth: (token: string, email: string) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminEmail', email);
    set({
      adminToken: token,
      adminEmail: email,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    set({
      adminToken: null,
      adminEmail: null,
      isAuthenticated: false,
    });
  },

  initialize: () => {
    const token = localStorage.getItem('adminToken');
    const email = localStorage.getItem('adminEmail');
    if (token && email) {
      set({
        adminToken: token,
        adminEmail: email,
        isAuthenticated: true,
      });
    }
  },
}));

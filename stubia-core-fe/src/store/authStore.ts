import { create } from 'zustand';

export type UserRole = 'super_admin' | 'academic_manager' | 'content_creator' | 'hr_ops' | 'finance_officer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (accessToken, user) => set({ accessToken, user, isAuthenticated: true, isLoading: false }),
  clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (accessToken, user) => set({ accessToken, user, isAuthenticated: true, isLoading: false }),
      clearAuth: () => {
        set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
        localStorage.removeItem('stubia_auth_storage');
      },
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'stubia_auth_storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If we had stored credentials, mark loading as false immediately
          if (state.accessToken && state.user) {
            state.isAuthenticated = true;
          }
          state.isLoading = false;
        }
      },
    }
  )
);


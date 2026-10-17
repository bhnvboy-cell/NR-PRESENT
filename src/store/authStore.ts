import { create } from 'zustand';
import type { AuthUser } from '../persistence/authApi';

interface AuthState {
  user: AuthUser | null;
  checked: boolean;
  setUser: (user: AuthUser | null) => void;
  setChecked: (checked: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  checked: false,
  setUser: (user) => set({ user, checked: true }),
  setChecked: (checked) => set({ checked }),
}));

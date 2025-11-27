"use client";

import { create } from "zustand";
import { type Account, type Session } from "pawdirecte-teacher";

import type { Credentials } from "@/types/appreciations";
import { loginUsingCredentials } from "@/lib/pawdirecte";
import { toast } from "sonner";

type AuthState = {
  credentials?: Credentials;
  session?: Session;
  account?: Account;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string;
};

type AuthActions = {
  authenticate: (credentials: Credentials) => Promise<void>;
  setAuthData: (payload: AuthState) => void;
  resetAuthData: () => void;
};

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  credentials: undefined,
  session: undefined,
  account: undefined,
  isLoading: false,
  isAuthenticated: false,
  error: undefined
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  authenticate: async ({ username, password }) => {
    set({
      ...initialState,
      isLoading: true
    });

    try {
      const { session, account } = await loginUsingCredentials(
        username,
        password
      );
      set({
        credentials: { username, password },
        session,
        account,
        isLoading: false,
        isAuthenticated: true,
        error: undefined
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue.";
      toast.error(message);
      set({
        ...initialState,
        error: message
      });
    }
  },
  setAuthData: (payload) =>
    set(() => ({
      ...initialState,
      ...payload,
      isAuthenticated: Boolean(
        payload.session && payload.account && payload.credentials
      )
    })),
  resetAuthData: () => set(() => initialState)
}));



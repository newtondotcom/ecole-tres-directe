"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Account, type Session } from "pawdirecte-teacher";

import type { Credentials } from "@/types/appreciations";
import { loginUsingCredentials, validateSession } from "@/lib/pawdirecte";
import { toast } from "sonner";

type AuthState = {
  credentials?: Credentials;
  session?: Session;
  account?: Account;
  rememberMe: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string;
};

type AuthActions = {
  authenticate: (credentials: Credentials, rememberMe?: boolean) => Promise<void>;
  validatePersistedSession: (password: string) => Promise<void>;
  setAuthData: (payload: AuthState) => void;
  resetAuthData: () => void;
};

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  credentials: undefined,
  session: undefined,
  account: undefined,
  rememberMe: false,
  isLoading: false,
  isAuthenticated: false,
  error: undefined
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      authenticate: async ({ username, password }, rememberMe = false) => {
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
            credentials: rememberMe ? { username, password } : { username, password: "" },
            session,
            account,
            rememberMe,
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
      validatePersistedSession: async (password: string) => {
        const state = useAuthStore.getState();
        if (!state.session) {
          throw new Error("Aucune session persistée trouvée.");
        }

        set({ isLoading: true });

        try {
          const { session, account } = await validateSession(
            state.session!,
            password
          );
          set({
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
              : "Impossible de valider la session.";
          toast.error(message);
          set({
            ...initialState,
            error: message
          });
          throw error;
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
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        session: state.rememberMe ? state.session : undefined,
        account: state.rememberMe ? state.account : undefined,
        credentials: state.rememberMe 
          ? { username: state.credentials?.username ?? "", password: "" } 
          : undefined,
        rememberMe: state.rememberMe
      })
    }
  )
);



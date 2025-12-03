import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Account, type Session } from "pawdirecte-teacher";

import type { Credentials } from "@/types/appreciations";
import { loginUsingCredentials, validateSession } from "@/lib/pawdirecte";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";

type AuthState = {
  credentials?: Credentials;
  session?: Session;
  account?: Account;
  rememberMe: boolean;
  isLoading: boolean;
  error?: string;
  isPatreonSubscribed?: boolean;
};

type AuthActions = {
  authenticate: (credentials: Credentials, rememberMe?: boolean) => Promise<void>;
  validatePersistedSession: (password: string) => Promise<void>;
  setAuthData: (payload: AuthState) => void;
  resetAuthData: () => void;
  isAuthenticated: () => boolean;
};

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  credentials: undefined,
  session: undefined,
  account: undefined,
  rememberMe: false,
  isLoading: false,
  error: undefined,
  isPatreonSubscribed: undefined,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set,get) => ({
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

          // Check Patreon subscription (non-blocking - allow login even if check fails)
          let isPatreonSubscribed = false;
          try {
            const result = await trpcClient.checkPatreonSubscription.mutate({
              accountId: account.id,
              firstName: account.firstName,
              lastName: account.lastName,
              schoolName: account.schoolName,
              username: session?.username,
            });
            isPatreonSubscribed = result.subscribed;
            
            if (!isPatreonSubscribed) {
              toast.error("Vous n'êtes pas abonné à Patreon. Merci de vous abonner pour accéder à toutes les fonctionnalités de Ecole Tres Directe.");
            }
          } catch (_patreonError) {
            // Log error but don't block authentication
            // Error silently ignored - continue with login even if Patreon check fails
            console.error(_patreonError);
          }
          
          set({
            credentials: rememberMe ? { username, password } : { username, password: "" },
            session,
            account,
            rememberMe,
            isLoading: false,
            error: undefined,
            isPatreonSubscribed,
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

          // Check Patreon subscription (non-blocking - allow login even if check fails)
          let isPatreonSubscribed = false;
          try {
            const result = await trpcClient.checkPatreonSubscription.mutate({
              accountId: account.id,
              firstName: account.firstName,
              lastName: account.lastName,
              schoolName: account.schoolName,
              username: session?.username,
            });
            isPatreonSubscribed = result.subscribed;
            
            if (!isPatreonSubscribed) {
              toast.error("Vous n'êtes pas abonné à Patreon. Vous pouvez vous abonner pour accéder à toutes les fonctionnalités de Ecole Tres Directe.", {
                action: {
                  label: "S'abonner",
                  onClick: () => {
                    window.open("https://www.patreon.com/ecoletresdirecte", "_blank");
                  },
                },
              });
            }
          } catch (_patreonError) {
            // Log error but don't block authentication
            // Error silently ignored - continue with login even if Patreon check fails
            console.error(_patreonError);
          }

          set({
            session,
            account,
            isLoading: false,
            error: undefined,
            isPatreonSubscribed,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Impossible de valider la session.";
          toast.error(message);
          set({
            ...initialState,
            error: message,
            isLoading: false,
          });
          throw error;
        }
      },
      setAuthData: (payload) =>
        set(() => ({
          ...initialState,
          ...payload
        })),
      resetAuthData: () => set(() => initialState),
      isAuthenticated: () => {
        const state = get();
        return Boolean(state.session && state.account);
      }
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        session: state.rememberMe ? state.session : undefined,
        account: state.rememberMe ? state.account : undefined,
        credentials: state.rememberMe 
          ? { username: state.credentials?.username ?? "", password: "" } 
          : undefined,
        rememberMe: state.rememberMe,
        isPatreonSubscribed: state.isPatreonSubscribed
      })
    }
  )
);



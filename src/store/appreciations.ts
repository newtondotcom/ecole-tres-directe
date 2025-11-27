"use client";

import { create } from "zustand";
import type { Session, Account } from "pawdirecte-teacher";

import type {
  PrincipalClassSummary,
  StudentRecap,
  StudentSummary,
  Credentials
} from "@/types/appreciations";
import { fetchAppreciationsData } from "@/actions/appreciations";
import { useAuthStore } from "@/store/auth";

export type Step =
  | "idle"
  | "authenticating"
  | "class_lookup"
  | "council_fetch"
  | "grades_fetch"
  | "ready"
  | "error";

 type AppreciationsStoreState = {
  step: Step;
  isLoading: boolean;
  error?: string;
  classSummary?: PrincipalClassSummary;
  students?: StudentSummary[];
  firstStudentRecap?: StudentRecap;
  credentials?: Credentials;
  session?: Session;
  account?: Account;
};

 type AppreciationsStoreActions = {
  getAppreciationsData: () => Promise<void>;
  reset: () => void;
};

export type AppreciationsStore = AppreciationsStoreState & AppreciationsStoreActions;

const initialState: AppreciationsStoreState = {
  step: "idle",
  isLoading: false,
  error: undefined,
  classSummary: undefined,
  students: undefined,
  firstStudentRecap: undefined,
  credentials: undefined,
  session: undefined,
  account: undefined
};

export const useAppreciationsStore = create<AppreciationsStore>((set, get) => ({
  ...initialState,
  getAppreciationsData: async () => {
    set({
      ...initialState,
      step: "authenticating",
      isLoading: true
    });

    try {
      const authStore = useAuthStore.getState();

      if (
        !authStore.session ||
        !authStore.account ||
        !authStore.credentials
      ) {
        throw new Error(
          "Aucune session active. Veuillez vous connecter depuis la page de connexion."
        );
      }

      const result = await fetchAppreciationsData({
        session: authStore.session,
        account: authStore.account
      });

      set({
        classSummary: result.classSummary,
        step: "class_lookup"
      });
      set({
        students: result.students,
        step: "council_fetch"
      });
      set({
        firstStudentRecap: result.firstStudentRecap,
        step: "grades_fetch",
        credentials: authStore.credentials,
        session: authStore.session,
        account: authStore.account
      });
      set({
        step: "ready",
        isLoading: false,
        error: undefined
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue.";
      set({
        ...initialState,
        step: "error",
        error: message,
        isLoading: false
      });
    } 
  },
  reset: () => {
    set(initialState);
  }
}));

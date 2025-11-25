"use client";

import { create } from "zustand";
import type {
  PrincipalClassSummary,
  StudentRecap,
  StudentSummary,
  Credentials
} from "@/types/appreciations";
import { fetchAppreciationsData } from "@/actions/appreciations";

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
};

type AppreciationsStoreActions = {
  authenticate: (credentials: Credentials) => Promise<void>;
  reset: () => void;
};

export type AppreciationsStore = AppreciationsStoreState & AppreciationsStoreActions;

const initialState: AppreciationsStoreState = {
  step: "idle",
  isLoading: false,
  credentials: undefined
};

export const useAppreciationsStore = create<AppreciationsStore>((set, get) => ({
  ...initialState,
  authenticate: async ({ username, password }) => {
    set({
      ...initialState,
      step: "authenticating",
      isLoading: true
    });

    try {
      const result = await fetchAppreciationsData({ username, password });
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
        credentials: { username, password }
      });
      set({
        step: "ready",
        isLoading: false
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue.";
      set({
        ...initialState,
        step: "error",
        error: message
      });
    } finally {
      if (get().step !== "ready" && get().step !== "error") {
        set({ isLoading: false });
      }
    }
  },
  reset: () => set(initialState)
}));


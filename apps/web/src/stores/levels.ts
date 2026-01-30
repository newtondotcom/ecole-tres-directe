import { create } from "zustand";
import { type Session } from "pawdirecte-teacher";
import { toast } from "sonner";

type School = {
  label: string;
  levels: Level[];
};

type Level = {
  label: string;
  classes: ClassItem[];
};

type ClassItem = {
  id: number;
  label: string;
  isCurrentUserPrincipal: boolean;
  periods: Period[];
};

type Period = {
  code: string;
  name?: string;
};

type LevelsData = {
  schools: School[];
};

type LevelsStoreState = {
  levels?: LevelsData;
  isLoading: boolean;
  error?: string;
  selectedSchool?: School;
  selectedLevel?: Level;
  selectedClass?: ClassItem;
};

type LevelsStoreActions = {
  fetchLevels: (session: Session, teacherId: number) => Promise<void>;
  getLevels: (session: Session, teacherId: number) => Promise<LevelsData>;
  setSelectedSchool: (school: School | undefined) => void;
  setSelectedLevel: (level: Level | undefined) => void;
  setSelectedClass: (classItem: ClassItem | undefined) => void;
  reset: () => void;
};

export type LevelsStore = LevelsStoreState & LevelsStoreActions;

const initialState: LevelsStoreState = {
  levels: undefined,
  isLoading: false,
  error: undefined,
  selectedSchool: undefined,
  selectedLevel: undefined,
  selectedClass: undefined,
};

export const useLevelsStore = create<LevelsStore>()((set, get) => ({
  ...initialState,

  fetchLevels: async (session: Session, teacherId: number) => {
    set({ isLoading: true, error: undefined });

    try {
      const { getLevels } = useLevelsStore();
      const levels = await getLevels(session, teacherId);
      const firstSchool = levels.schools[0];
      const firstLevel = firstSchool?.levels[0];
      const firstClass = firstLevel?.classes[0];

      set({
        levels,
        selectedSchool: firstSchool,
        selectedLevel: firstLevel,
        selectedClass: firstClass,
        isLoading: false,
        error: undefined,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la récupération des niveaux";

      set({
        levels: undefined,
        selectedSchool: undefined,
        selectedLevel: undefined,
        selectedClass: undefined,
        isLoading: false,
        error: errorMessage,
      });

      toast.error(errorMessage);
    }
  },

  getLevels: async (session: Session, teacherId: number) => {
    const state = get();

    if (state.levels) {
      return state.levels;
    }

    await state.fetchLevels(session, teacherId);
    return get().levels!;
  },

  setSelectedSchool: (school: School | undefined) => {
    set({
      selectedSchool: school,
      selectedLevel: undefined,
      selectedClass: undefined,
    });
  },

  setSelectedLevel: (level: Level | undefined) => {
    set({
      selectedLevel: level,
      selectedClass: undefined,
    });
  },

  setSelectedClass: (classItem: ClassItem | undefined) => {
    set({ selectedClass: classItem });
  },

  reset: () => {
    set(initialState);
  },
}));

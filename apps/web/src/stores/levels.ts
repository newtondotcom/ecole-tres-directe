import { create } from "zustand";
import { teacherLevelsList, type Session } from "pawdirecte-teacher";
import { toast } from "sonner";
import { pickDefaultPeriod } from "@/lib/period";

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

export type Period = {
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
  selectedPeriod?: Period;
};

type LevelsStoreActions = {
  fetchLevels: (session: Session, teacherId: number) => Promise<void>;
  getLevels: (session: Session, teacherId: number) => Promise<LevelsData>;
  setSelectedSchool: (school: School | undefined) => void;
  setSelectedLevel: (level: Level | undefined) => void;
  setSelectedClass: (classItem: ClassItem | undefined) => void;
  setSelectedPeriod: (period: Period | undefined) => void;
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
  selectedPeriod: undefined,
};

function findPrincipalClass(levels: LevelsData): ClassItem | undefined {
  for (const school of levels.schools) {
    for (const level of school.levels) {
      for (const classItem of level.classes) {
        if (classItem.isCurrentUserPrincipal) return classItem;
      }
    }
  }
  return undefined;
}

function findClassContext(levels: LevelsData, classItem: ClassItem) {
  for (const school of levels.schools) {
    for (const level of school.levels) {
      if (level.classes.some((item) => item.id === classItem.id)) {
        return { school, level, classItem };
      }
    }
  }
  return undefined;
}

export const useLevelsStore = create<LevelsStore>()((set, get) => ({
  ...initialState,

  fetchLevels: async (session: Session, teacherId: number) => {
    set({ isLoading: true, error: undefined });

    try {
      const levels = await teacherLevelsList(session, teacherId);
      const principalClass = findPrincipalClass(levels);
      const firstSchool = levels.schools[0];
      const context = principalClass
        ? findClassContext(levels, principalClass)
        : firstSchool
          ? { school: firstSchool, level: firstSchool.levels[0], classItem: firstSchool.levels[0]?.classes[0] }
          : undefined;
      const selectedClass = context?.classItem;
      const selectedPeriod = selectedClass ? pickDefaultPeriod(selectedClass.periods) : undefined;

      set({
        levels,
        selectedSchool: context?.school ?? firstSchool,
        selectedLevel: context?.level ?? firstSchool?.levels[0],
        selectedClass,
        selectedPeriod,
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
        selectedPeriod: undefined,
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

    await get().fetchLevels(session, teacherId);
    return get().levels!;
  },

  setSelectedSchool: (school: School | undefined) => {
    set({
      selectedSchool: school,
      selectedLevel: undefined,
      selectedClass: undefined,
      selectedPeriod: undefined,
    });
  },

  setSelectedLevel: (level: Level | undefined) => {
    set({
      selectedLevel: level,
      selectedClass: undefined,
      selectedPeriod: undefined,
    });
  },

  setSelectedClass: (classItem: ClassItem | undefined) => {
    set({
      selectedClass: classItem,
      selectedPeriod: classItem ? pickDefaultPeriod(classItem.periods) : undefined,
    });
  },

  setSelectedPeriod: (period: Period | undefined) => {
    set({ selectedPeriod: period });
  },

  reset: () => {
    set(initialState);
  },
}));

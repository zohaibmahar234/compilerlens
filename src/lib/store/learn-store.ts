import { create } from "zustand";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  duration: string;
  badge: string;
  content: string;
  quiz: QuizQuestion[];
}

export interface LearnStore {
  completedLessons: string[];
  quizScores: Record<string, number>;
  unlockedBadges: string[];
  activeLessonId: string;
  completeLesson: (id: string, score: number, badge: string) => void;
  setActiveLesson: (id: string) => void;
  resetProgress: () => void;
}

const STORAGE_KEY = "compilerlens_learn_progress";

const loadInitialState = () => {
  if (typeof window === "undefined") {
    return { completedLessons: [], quizScores: {}, unlockedBadges: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return { completedLessons: [], quizScores: {}, unlockedBadges: [] };
};

export const useLearnStore = create<LearnStore>((set) => ({
  ...loadInitialState(),
  activeLessonId: "lexical-analysis",

  setActiveLesson: (id: string) => set({ activeLessonId: id }),

  completeLesson: (id: string, score: number, badge: string) => {
    set((state) => {
      const nextCompleted = Array.from(new Set([...state.completedLessons, id]));
      const nextScores = { ...state.quizScores, [id]: score };
      const nextBadges = Array.from(new Set([...state.unlockedBadges, badge]));

      const newState = {
        completedLessons: nextCompleted,
        quizScores: nextScores,
        unlockedBadges: nextBadges,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      }

      return newState;
    });
  },

  resetProgress: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({
      completedLessons: [],
      quizScores: {},
      unlockedBadges: [],
    });
  },
}));

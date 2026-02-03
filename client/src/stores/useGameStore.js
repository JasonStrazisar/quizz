import { create } from "zustand";

const initialState = {
  role: null,
  sessionId: null,
  code: null,
  quiz: null,
  phase: "lobby",
  question: null,
  answers: [],
  index: 0,
  total: 0,
  leaderboard: [],
  distribution: [],
  answeredCount: 0,
  totalPlayers: 0,
  hint: "",
  explanationPart1: "",
  explanationPart2: "",
  correctAnswers: [],
  player: {
    nickname: "",
    color: "accent-blue",
    score: 0,
    rank: null
  }
};

const useGameStore = create((set) => ({
  ...initialState,
  setRole: (role) => set({ role }),
  setSession: (payload) => set(payload),
  setPhase: (phase) => set({ phase }),
  setQuestion: (payload) => set({ question: payload.question, answers: payload.answers, index: payload.index, total: payload.total }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setDistribution: (distribution) => set({ distribution }),
  setAnswerStats: (payload) => set({ answeredCount: payload.answeredCount, totalPlayers: payload.totalPlayers }),
  setExplanation: (payload) =>
    set({
      hint: payload.hint || "",
      explanationPart1: payload.part1 || "",
      explanationPart2: payload.part2 || "",
      correctAnswers: payload.correctAnswers || []
    }),
  setPlayer: (payload) => set((state) => ({ player: { ...state.player, ...payload } })),
  reset: () => set(initialState)
}));

export default useGameStore;

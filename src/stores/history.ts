import { create } from "zustand";
import { historySearch, type HistoryEntry } from "@/ipc/history";
import type { PaneId } from "@/types/workspace";

interface HistoryStore {
  visible: boolean;
  paneId: PaneId | null;
  query: string;
  results: HistoryEntry[];
  selectedIndex: number;

  open: (paneId: PaneId) => void;
  close: () => void;
  setQuery: (query: string) => void;
  moveUp: () => void;
  moveDown: () => void;
  getSelected: () => HistoryEntry | null;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  visible: false,
  paneId: null,
  query: "",
  results: [],
  selectedIndex: 0,

  open: (paneId) => {
    set({ visible: true, paneId, query: "", selectedIndex: 0 });
    historySearch("", 50)
      .then((results) => set({ results }))
      .catch(console.error);
  },

  close: () => set({ visible: false, paneId: null, query: "", results: [], selectedIndex: 0 }),

  setQuery: (query) => {
    set({ query, selectedIndex: 0 });
    historySearch(query, 50)
      .then((results) => set({ results }))
      .catch(console.error);
  },

  moveUp: () => {
    const { selectedIndex, results } = get();
    set({ selectedIndex: selectedIndex > 0 ? selectedIndex - 1 : results.length - 1 });
  },

  moveDown: () => {
    const { selectedIndex, results } = get();
    set({ selectedIndex: selectedIndex < results.length - 1 ? selectedIndex + 1 : 0 });
  },

  getSelected: () => {
    const { results, selectedIndex } = get();
    return results[selectedIndex] ?? null;
  },
}));

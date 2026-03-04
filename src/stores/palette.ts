import { create } from "zustand";
import { PALETTE_COMMANDS, type PaletteCommand } from "@/data/commands";

interface PaletteStore {
  visible: boolean;
  query: string;
  selectedIndex: number;
  filtered: PaletteCommand[];

  open: () => void;
  close: () => void;
  setQuery: (q: string) => void;
  moveUp: () => void;
  moveDown: () => void;
  getSelected: () => PaletteCommand | null;
}

function filter(query: string): PaletteCommand[] {
  if (!query) return PALETTE_COMMANDS;
  const q = query.toLowerCase();
  return PALETTE_COMMANDS
    .filter((c) => c.label.toLowerCase().includes(q) || c.category.includes(q))
    .sort((a, b) => {
      const aStart = a.label.toLowerCase().startsWith(q) ? 1 : 0;
      const bStart = b.label.toLowerCase().startsWith(q) ? 1 : 0;
      return bStart - aStart;
    });
}

export const usePaletteStore = create<PaletteStore>((set, get) => ({
  visible: false,
  query: "",
  selectedIndex: 0,
  filtered: PALETTE_COMMANDS,

  open: () => set({ visible: true, query: "", selectedIndex: 0, filtered: PALETTE_COMMANDS }),
  close: () => set({ visible: false, query: "", selectedIndex: 0 }),

  setQuery: (q) => {
    const filtered = filter(q);
    set({ query: q, filtered, selectedIndex: 0 });
  },

  moveUp: () => {
    const { selectedIndex, filtered } = get();
    set({ selectedIndex: selectedIndex > 0 ? selectedIndex - 1 : filtered.length - 1 });
  },

  moveDown: () => {
    const { selectedIndex, filtered } = get();
    set({ selectedIndex: selectedIndex < filtered.length - 1 ? selectedIndex + 1 : 0 });
  },

  getSelected: () => {
    const { filtered, selectedIndex } = get();
    return filtered[selectedIndex] ?? null;
  },
}));

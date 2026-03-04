import { create } from "zustand";
import { CLAUDE_COMMANDS, type ClaudeCommand } from "@/data/claudeCommands";
import type { PaneId } from "@/types/workspace";

interface AutocompleteState {
  visible: boolean;
  paneId: PaneId | null;
  query: string;          // text after "/"
  selectedIndex: number;
  filtered: ClaudeCommand[];
  usageCounts: Record<string, number>;

  open: (paneId: PaneId) => void;
  close: () => void;
  setQuery: (query: string) => void;
  moveUp: () => void;
  moveDown: () => void;
  getSelected: () => ClaudeCommand | null;
  recordUsage: (name: string) => void;
}

const USAGE_KEY = "yeonhoo_cmd_usage";

function loadUsage(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function scoreCommand(cmd: ClaudeCommand, query: string, usage: Record<string, number>): number {
  const name = cmd.name.slice(1).toLowerCase(); // remove leading /
  const q = query.toLowerCase();
  let score = usage[cmd.name] || 0;

  // Exact prefix match gets highest boost
  if (name.startsWith(q)) score += 100;
  // Contains match
  else if (name.includes(q)) score += 50;
  // Description match
  else if (cmd.description.toLowerCase().includes(q)) score += 10;

  return score;
}

function filterAndSort(query: string, usage: Record<string, number>): ClaudeCommand[] {
  const q = query.toLowerCase();
  return CLAUDE_COMMANDS
    .filter((cmd) => {
      if (!q) return true;
      const name = cmd.name.slice(1).toLowerCase();
      return name.includes(q) || cmd.description.toLowerCase().includes(q);
    })
    .sort((a, b) => scoreCommand(b, query, usage) - scoreCommand(a, query, usage));
}

export const useAutocompleteStore = create<AutocompleteState>((set, get) => ({
  visible: false,
  paneId: null,
  query: "",
  selectedIndex: 0,
  filtered: [],
  usageCounts: loadUsage(),

  open: (paneId) => {
    const usage = get().usageCounts;
    set({
      visible: true,
      paneId,
      query: "",
      selectedIndex: 0,
      filtered: filterAndSort("", usage),
    });
  },

  close: () => set({ visible: false, paneId: null, query: "", selectedIndex: 0 }),

  setQuery: (query) => {
    const usage = get().usageCounts;
    const filtered = filterAndSort(query, usage);
    set({
      query,
      filtered,
      selectedIndex: 0,
    });
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

  recordUsage: (name) => {
    const counts = { ...get().usageCounts };
    counts[name] = (counts[name] || 0) + 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify(counts));
    set({ usageCounts: counts });
  },
}));

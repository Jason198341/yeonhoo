import { create } from "zustand";
import { scanPlugins, type PluginManifest } from "@/ipc/plugin";
import { THEMES, type YeonhooTheme } from "@/lib/themes";
import { CLAUDE_COMMANDS, type ClaudeCommand } from "@/data/claudeCommands";

interface PluginStore {
  plugins: PluginManifest[];
  loaded: boolean;

  load: () => Promise<void>;
  getAllThemes: () => Record<string, YeonhooTheme>;
  getAllCommands: () => ClaudeCommand[];
}

export const usePluginStore = create<PluginStore>((set, get) => ({
  plugins: [],
  loaded: false,

  load: async () => {
    try {
      const plugins = await scanPlugins();
      set({ plugins, loaded: true });
    } catch (err) {
      console.error("Failed to scan plugins:", err);
      set({ loaded: true });
    }
  },

  getAllThemes: () => {
    const { plugins } = get();
    const merged = { ...THEMES };
    for (const plugin of plugins) {
      for (const t of plugin.themes) {
        merged[t.id] = {
          id: t.id,
          name: t.name,
          terminal: t.terminal as unknown as YeonhooTheme["terminal"],
          ui: t.ui as unknown as YeonhooTheme["ui"],
        };
      }
    }
    return merged;
  },

  getAllCommands: () => {
    const { plugins } = get();
    const extra: ClaudeCommand[] = [];
    for (const plugin of plugins) {
      for (const cmd of plugin.commands) {
        extra.push({
          name: cmd.name,
          description: cmd.description,
          syntax: cmd.syntax || cmd.name,
          category: (cmd.category as ClaudeCommand["category"]) || "workflow",
        });
      }
    }
    return [...CLAUDE_COMMANDS, ...extra];
  },
}));

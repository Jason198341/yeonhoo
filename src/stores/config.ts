import { create } from "zustand";
import { getConfig, setConfig, type AppConfig } from "@/ipc/config";
import { getTheme, type YeonhooTheme } from "@/lib/themes";

interface ConfigStore {
  config: AppConfig | null;
  theme: YeonhooTheme;
  loaded: boolean;

  load: () => Promise<void>;
  update: (patch: Partial<AppConfig>) => Promise<void>;
  setTheme: (themeId: string) => Promise<void>;
}

function applyThemeCSS(theme: YeonhooTheme) {
  const root = document.documentElement;
  root.style.setProperty("--bg", theme.ui.bg);
  root.style.setProperty("--bg-secondary", theme.ui.bgSecondary);
  root.style.setProperty("--border", theme.ui.border);
  root.style.setProperty("--text", theme.ui.text);
  root.style.setProperty("--text-muted", theme.ui.textMuted);
  root.style.setProperty("--accent", theme.ui.accent);
  root.style.setProperty("--accent-dim", theme.ui.accentDim);
}

const defaultTheme = getTheme("yeonhoo-dark");

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  theme: defaultTheme,
  loaded: false,

  load: async () => {
    try {
      const config = await getConfig();
      const theme = getTheme(config.appearance.theme);
      applyThemeCSS(theme);
      set({ config, theme, loaded: true });
    } catch (err) {
      console.error("Failed to load config:", err);
      applyThemeCSS(defaultTheme);
      set({ loaded: true });
    }
  },

  update: async (patch) => {
    const current = get().config;
    if (!current) return;
    const merged = { ...current, ...patch };
    await setConfig(merged);
    const theme = getTheme(merged.appearance.theme);
    applyThemeCSS(theme);
    set({ config: merged, theme });
  },

  setTheme: async (themeId) => {
    const current = get().config;
    if (!current) return;
    const updated = {
      ...current,
      appearance: { ...current.appearance, theme: themeId },
    };
    await setConfig(updated);
    const theme = getTheme(themeId);
    applyThemeCSS(theme);
    set({ config: updated, theme });
  },
}));

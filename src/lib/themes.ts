export interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  selectionBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface YeonhooTheme {
  id: string;
  name: string;
  terminal: TerminalTheme;
  ui: {
    bg: string;
    bgSecondary: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    accentDim: string;
  };
}

export const THEMES: Record<string, YeonhooTheme> = {
  "yeonhoo-dark": {
    id: "yeonhoo-dark",
    name: "Yeonhoo Dark",
    terminal: {
      background: "#0a0e1a",
      foreground: "#e2e8f0",
      cursor: "#8b5cf6",
      selectionBackground: "#8b5cf644",
      black: "#1e293b",
      red: "#ef4444",
      green: "#22c55e",
      yellow: "#eab308",
      blue: "#3b82f6",
      magenta: "#a855f7",
      cyan: "#06b6d4",
      white: "#e2e8f0",
      brightBlack: "#475569",
      brightRed: "#f87171",
      brightGreen: "#4ade80",
      brightYellow: "#facc15",
      brightBlue: "#60a5fa",
      brightMagenta: "#c084fc",
      brightCyan: "#22d3ee",
      brightWhite: "#f8fafc",
    },
    ui: {
      bg: "#0a0e1a",
      bgSecondary: "#0f1629",
      border: "#1e293b",
      text: "#e2e8f0",
      textMuted: "#64748b",
      accent: "#8b5cf6",
      accentDim: "#8b5cf644",
    },
  },

  "midnight-ocean": {
    id: "midnight-ocean",
    name: "Midnight Ocean",
    terminal: {
      background: "#0d1117",
      foreground: "#c9d1d9",
      cursor: "#58a6ff",
      selectionBackground: "#58a6ff44",
      black: "#161b22",
      red: "#ff7b72",
      green: "#3fb950",
      yellow: "#d29922",
      blue: "#58a6ff",
      magenta: "#bc8cff",
      cyan: "#39d2c0",
      white: "#c9d1d9",
      brightBlack: "#484f58",
      brightRed: "#ffa198",
      brightGreen: "#56d364",
      brightYellow: "#e3b341",
      brightBlue: "#79c0ff",
      brightMagenta: "#d2a8ff",
      brightCyan: "#56d4dd",
      brightWhite: "#f0f6fc",
    },
    ui: {
      bg: "#0d1117",
      bgSecondary: "#161b22",
      border: "#30363d",
      text: "#c9d1d9",
      textMuted: "#8b949e",
      accent: "#58a6ff",
      accentDim: "#58a6ff44",
    },
  },

  "aurora-green": {
    id: "aurora-green",
    name: "Aurora Green",
    terminal: {
      background: "#0a1210",
      foreground: "#d4e7d0",
      cursor: "#4ade80",
      selectionBackground: "#4ade8044",
      black: "#1a2e1a",
      red: "#f87171",
      green: "#4ade80",
      yellow: "#fbbf24",
      blue: "#60a5fa",
      magenta: "#c084fc",
      cyan: "#22d3ee",
      white: "#d4e7d0",
      brightBlack: "#3f6e3f",
      brightRed: "#fca5a5",
      brightGreen: "#86efac",
      brightYellow: "#fcd34d",
      brightBlue: "#93c5fd",
      brightMagenta: "#d8b4fe",
      brightCyan: "#67e8f9",
      brightWhite: "#f0fdf4",
    },
    ui: {
      bg: "#0a1210",
      bgSecondary: "#0f1f18",
      border: "#1a3a2a",
      text: "#d4e7d0",
      textMuted: "#6b8f6b",
      accent: "#4ade80",
      accentDim: "#4ade8044",
    },
  },

  "warm-ember": {
    id: "warm-ember",
    name: "Warm Ember",
    terminal: {
      background: "#1a1110",
      foreground: "#e8dcd0",
      cursor: "#f59e0b",
      selectionBackground: "#f59e0b44",
      black: "#2a1f1a",
      red: "#ef4444",
      green: "#84cc16",
      yellow: "#f59e0b",
      blue: "#3b82f6",
      magenta: "#ec4899",
      cyan: "#06b6d4",
      white: "#e8dcd0",
      brightBlack: "#6b5040",
      brightRed: "#f87171",
      brightGreen: "#a3e635",
      brightYellow: "#fbbf24",
      brightBlue: "#60a5fa",
      brightMagenta: "#f472b6",
      brightCyan: "#22d3ee",
      brightWhite: "#fdf8f0",
    },
    ui: {
      bg: "#1a1110",
      bgSecondary: "#241a16",
      border: "#3d2a20",
      text: "#e8dcd0",
      textMuted: "#8b7060",
      accent: "#f59e0b",
      accentDim: "#f59e0b44",
    },
  },

  "yeonhoo-light": {
    id: "yeonhoo-light",
    name: "Yeonhoo Light",
    terminal: {
      background: "#fafafa",
      foreground: "#1e293b",
      cursor: "#7c3aed",
      selectionBackground: "#7c3aed33",
      black: "#1e293b",
      red: "#dc2626",
      green: "#16a34a",
      yellow: "#ca8a04",
      blue: "#2563eb",
      magenta: "#9333ea",
      cyan: "#0891b2",
      white: "#f1f5f9",
      brightBlack: "#64748b",
      brightRed: "#ef4444",
      brightGreen: "#22c55e",
      brightYellow: "#eab308",
      brightBlue: "#3b82f6",
      brightMagenta: "#a855f7",
      brightCyan: "#06b6d4",
      brightWhite: "#ffffff",
    },
    ui: {
      bg: "#fafafa",
      bgSecondary: "#f1f5f9",
      border: "#e2e8f0",
      text: "#1e293b",
      textMuted: "#94a3b8",
      accent: "#7c3aed",
      accentDim: "#7c3aed33",
    },
  },
};

export function getTheme(id: string): YeonhooTheme {
  return THEMES[id] ?? THEMES["yeonhoo-dark"];
}

export function getThemeList(): { id: string; name: string }[] {
  return Object.values(THEMES).map((t) => ({ id: t.id, name: t.name }));
}

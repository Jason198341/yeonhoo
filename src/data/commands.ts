export interface PaletteCommand {
  id: string;
  label: string;
  shortcut?: string;
  category: "tab" | "pane" | "theme" | "history" | "app";
  action: string; // action identifier
}

export const PALETTE_COMMANDS: PaletteCommand[] = [
  // Tab
  { id: "tab.new", label: "New Tab", shortcut: "Ctrl+Shift+T", category: "tab", action: "tab.new" },
  { id: "tab.close", label: "Close Tab", shortcut: "Ctrl+Shift+W", category: "tab", action: "tab.close" },
  { id: "tab.next", label: "Next Tab", shortcut: "Ctrl+Tab", category: "tab", action: "tab.next" },
  { id: "tab.prev", label: "Previous Tab", shortcut: "Ctrl+Shift+Tab", category: "tab", action: "tab.prev" },

  // Pane
  { id: "pane.splitH", label: "Split Horizontal", shortcut: "Ctrl+Shift+\\", category: "pane", action: "pane.splitH" },
  { id: "pane.splitV", label: "Split Vertical", shortcut: "Ctrl+Shift+-", category: "pane", action: "pane.splitV" },
  { id: "pane.close", label: "Close Pane", shortcut: "Ctrl+Shift+X", category: "pane", action: "pane.close" },

  // Theme
  { id: "theme.dark", label: "Theme: Yeonhoo Dark", category: "theme", action: "theme.yeonhoo-dark" },
  { id: "theme.ocean", label: "Theme: Midnight Ocean", category: "theme", action: "theme.midnight-ocean" },
  { id: "theme.green", label: "Theme: Aurora Green", category: "theme", action: "theme.aurora-green" },
  { id: "theme.ember", label: "Theme: Warm Ember", category: "theme", action: "theme.warm-ember" },
  { id: "theme.light", label: "Theme: Yeonhoo Light", category: "theme", action: "theme.yeonhoo-light" },

  // History
  { id: "history.search", label: "Search History", shortcut: "Ctrl+R", category: "history", action: "history.search" },
  { id: "history.clear", label: "Clear All History", category: "history", action: "history.clear" },

  // App
  { id: "app.config", label: "Open Config File", category: "app", action: "app.config" },
  { id: "app.reload", label: "Reload Config", category: "app", action: "app.reload" },
  { id: "app.devtools", label: "Toggle DevTools", shortcut: "F12", category: "app", action: "app.devtools" },
];

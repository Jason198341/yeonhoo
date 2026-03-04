import { useEffect, useRef } from "react";
import { usePaletteStore } from "@/stores/palette";
import { useWorkspaceStore } from "@/stores/workspace";
import { useConfigStore } from "@/stores/config";
import { useHistoryStore } from "@/stores/history";
import { createPane, closePane as ipcClosePane } from "@/ipc/terminal";
import { getConfigPath } from "@/ipc/config";
import { historyClear } from "@/ipc/history";

function useExecuteAction() {
  const addTab = useWorkspaceStore((s) => s.addTab);
  const removeTab = useWorkspaceStore((s) => s.removeTab);
  const tabs = useWorkspaceStore((s) => s.tabs);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);
  const splitPane = useWorkspaceStore((s) => s.splitPane);
  const closePaneFn = useWorkspaceStore((s) => s.closePane);
  const activeTab = useWorkspaceStore((s) => s.activeTab)();
  const setTheme = useConfigStore((s) => s.setTheme);
  const loadConfig = useConfigStore((s) => s.load);

  return async (action: string) => {
    // Tab actions
    if (action === "tab.new") {
      const paneId = await createPane();
      addTab(paneId);
    } else if (action === "tab.close") {
      if (activeTabId) {
        const removed = removeTab(activeTabId);
        for (const id of removed) ipcClosePane(id).catch(console.error);
      }
    } else if (action === "tab.next") {
      const idx = tabs.findIndex((t) => t.id === activeTabId);
      if (idx >= 0 && tabs.length > 1) setActiveTab(tabs[(idx + 1) % tabs.length].id);
    } else if (action === "tab.prev") {
      const idx = tabs.findIndex((t) => t.id === activeTabId);
      if (idx >= 0 && tabs.length > 1) setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length].id);

    // Pane actions
    } else if (action === "pane.splitH" && activeTab) {
      const paneId = await createPane();
      splitPane(activeTab.activePaneId, "horizontal", paneId);
    } else if (action === "pane.splitV" && activeTab) {
      const paneId = await createPane();
      splitPane(activeTab.activePaneId, "vertical", paneId);
    } else if (action === "pane.close" && activeTab) {
      const removed = closePaneFn(activeTab.activePaneId);
      for (const id of removed) ipcClosePane(id).catch(console.error);

    // Theme actions
    } else if (action.startsWith("theme.")) {
      setTheme(action.slice(6));

    // History
    } else if (action === "history.search") {
      useHistoryStore.getState().open(activeTab?.activePaneId ?? "");
    } else if (action === "history.clear") {
      await historyClear();

    // App
    } else if (action === "app.config") {
      const path = await getConfigPath();
      // Open in default editor via shell
      const { terminalInput } = await import("@/ipc/terminal");
      if (activeTab) terminalInput(activeTab.activePaneId, `code "${path}"\r`).catch(console.error);
    } else if (action === "app.reload") {
      await loadConfig();
    } else if (action === "app.devtools") {
      const { invoke } = await import("@tauri-apps/api/core");
      invoke("plugin:webview|toggle_devtools").catch(console.error);
    }
  };
}

export default function CommandPalette() {
  const { visible, query, filtered, selectedIndex } = usePaletteStore();
  const setQuery = usePaletteStore((s) => s.setQuery);
  const close = usePaletteStore((s) => s.close);
  const getSelected = usePaletteStore((s) => s.getSelected);
  const moveUp = usePaletteStore((s) => s.moveUp);
  const moveDown = usePaletteStore((s) => s.moveDown);
  const executeAction = useExecuteAction();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && inputRef.current) inputRef.current.focus();
  }, [visible]);

  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") { e.preventDefault(); moveUp(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); moveDown(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = getSelected();
      if (cmd) {
        close();
        executeAction(cmd.action).catch(console.error);
      }
    }
    else if (e.key === "Escape") { close(); }
  };

  if (!visible) return null;

  return (
    <div className="command-palette" onKeyDown={handleKeyDown}>
      <div className="palette-header">
        <input
          ref={inputRef}
          className="palette-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          spellCheck={false}
        />
      </div>
      <div className="palette-list" ref={listRef}>
        {filtered.map((cmd, i) => (
          <div
            key={cmd.id}
            className={`palette-item ${i === selectedIndex ? "selected" : ""}`}
            onClick={() => { close(); executeAction(cmd.action).catch(console.error); }}
          >
            <span className="palette-label">{cmd.label}</span>
            {cmd.shortcut && <span className="palette-shortcut">{cmd.shortcut}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

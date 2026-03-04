import { useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspace";
import { usePaletteStore } from "@/stores/palette";
import { createPane, closePane as ipcClosePane } from "@/ipc/terminal";

export function useKeyboardShortcuts() {
  const addTab = useWorkspaceStore((s) => s.addTab);
  const removeTab = useWorkspaceStore((s) => s.removeTab);
  const tabs = useWorkspaceStore((s) => s.tabs);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);
  const splitPane = useWorkspaceStore((s) => s.splitPane);
  const closePaneAction = useWorkspaceStore((s) => s.closePane);
  const activeTab = useWorkspaceStore((s) => s.activeTab)();

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey;
      const shift = e.shiftKey;

      // Ctrl+Shift+P — Command Palette
      if (ctrl && shift && e.key === "P") {
        e.preventDefault();
        usePaletteStore.getState().open();
        return;
      }

      // Ctrl+Shift+T — New tab
      if (ctrl && shift && e.key === "T") {
        e.preventDefault();
        try {
          const paneId = await createPane();
          addTab(paneId);
        } catch (err) {
          console.error(err);
        }
        return;
      }

      // Ctrl+Shift+W — Close tab
      if (ctrl && shift && e.key === "W") {
        e.preventDefault();
        if (activeTabId) {
          const removed = removeTab(activeTabId);
          for (const id of removed) {
            ipcClosePane(id).catch(console.error);
          }
        }
        return;
      }

      // Ctrl+Tab — Next tab
      if (ctrl && !shift && e.key === "Tab") {
        e.preventDefault();
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        if (idx >= 0 && tabs.length > 1) {
          setActiveTab(tabs[(idx + 1) % tabs.length].id);
        }
        return;
      }

      // Ctrl+Shift+Tab — Previous tab
      if (ctrl && shift && e.key === "Tab") {
        e.preventDefault();
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        if (idx >= 0 && tabs.length > 1) {
          setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length].id);
        }
        return;
      }

      // Ctrl+Shift+\ — Split horizontal (left-right)
      if (ctrl && shift && e.key === "|") {
        e.preventDefault();
        if (!activeTab) return;
        try {
          const newPaneId = await createPane();
          splitPane(activeTab.activePaneId, "horizontal", newPaneId);
        } catch (err) {
          console.error(err);
        }
        return;
      }

      // Ctrl+Shift+- — Split vertical (top-bottom)
      if (ctrl && shift && e.key === "_") {
        e.preventDefault();
        if (!activeTab) return;
        try {
          const newPaneId = await createPane();
          splitPane(activeTab.activePaneId, "vertical", newPaneId);
        } catch (err) {
          console.error(err);
        }
        return;
      }

      // Ctrl+Shift+X — Close active pane
      if (ctrl && shift && e.key === "X") {
        e.preventDefault();
        if (!activeTab) return;
        const removed = closePaneAction(activeTab.activePaneId);
        for (const id of removed) {
          ipcClosePane(id).catch(console.error);
        }
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    addTab,
    removeTab,
    tabs,
    activeTabId,
    setActiveTab,
    splitPane,
    closePaneAction,
    activeTab,
  ]);
}

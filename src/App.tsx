import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace";
import { useConfigStore } from "@/stores/config";
import { usePluginStore } from "@/stores/plugin";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { createPane } from "@/ipc/terminal";
import { sessionLoad } from "@/ipc/session";
import type { PaneTree } from "@/types/workspace";
import TabBar from "@/components/tab/TabBar";
import PaneContainer from "@/components/pane/PaneContainer";
import StatusBar from "@/components/statusbar/StatusBar";
import HistorySearch from "@/components/overlay/HistorySearch";
import CommandPalette from "@/components/overlay/CommandPalette";
import "./App.css";

/** Collect all leaf pane IDs from a tree */
function collectLeafIds(tree: PaneTree): string[] {
  if (tree.type === "leaf") return [tree.paneId];
  return [...collectLeafIds(tree.first), ...collectLeafIds(tree.second)];
}

/** Replace old pane IDs in tree with new ones using a mapping */
function remapTree(tree: PaneTree, idMap: Map<string, string>): PaneTree {
  if (tree.type === "leaf") {
    return { type: "leaf", paneId: idMap.get(tree.paneId) ?? tree.paneId };
  }
  return {
    ...tree,
    first: remapTree(tree.first, idMap),
    second: remapTree(tree.second, idMap),
  };
}

function App() {
  const activeTab = useWorkspaceStore((s) => s.activeTab)();
  const loadConfig = useConfigStore((s) => s.load);
  const [ready, setReady] = useState(false);
  const initRef = useRef(false);

  useKeyboardShortcuts();

  // Load config + restore session or create initial tab
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    Promise.all([loadConfig(), usePluginStore.getState().load()])
      .then(() => sessionLoad())
      .then(async (session) => {
        const store = useWorkspaceStore.getState();

        if (session && session.tabs.length > 0) {
          // Restore session: create new PTYs for each leaf, remap IDs
          for (const tab of session.tabs) {
            const oldIds = collectLeafIds(tab.tree);
            const idMap = new Map<string, string>();

            for (const oldId of oldIds) {
              const newId = await createPane();
              idMap.set(oldId, newId);
            }

            const newTree = remapTree(tab.tree, idMap);
            const newActivePaneId = idMap.get(tab.activePaneId) ?? collectLeafIds(newTree)[0];

            store.addTab(collectLeafIds(newTree)[0]);
            // Replace the auto-created single-leaf tab with our restored tree
            const tabs = useWorkspaceStore.getState().tabs;
            const lastTab = tabs[tabs.length - 1];
            useWorkspaceStore.setState((s) => ({
              tabs: s.tabs.map((t) =>
                t.id === lastTab.id
                  ? { ...t, title: tab.title, tree: newTree, activePaneId: newActivePaneId }
                  : t,
              ),
            }));
          }

          // Set active tab to first (closest match)
          const restored = useWorkspaceStore.getState().tabs;
          if (restored.length > 0) {
            const activeIdx = Math.min(
              session.tabs.findIndex((t) => t.id === session.activeTabId),
              restored.length - 1,
            );
            store.setActiveTab(restored[Math.max(0, activeIdx)].id);
          }
        } else {
          // No session — create fresh tab
          const paneId = await createPane();
          store.addTab(paneId);
        }

        setReady(true);
      })
      .catch((err) => {
        console.error("Failed to initialize:", err);
        // Fallback: create a fresh tab
        createPane().then((paneId) => {
          useWorkspaceStore.getState().addTab(paneId);
          setReady(true);
        });
      });
  }, []);

  return (
    <div className="app">
      <TabBar />
      <div className="workspace">
        {ready && activeTab ? (
          <PaneContainer tree={activeTab.tree} activePaneId={activeTab.activePaneId} />
        ) : (
          <div className="workspace-empty">Starting terminal...</div>
        )}
      </div>
      <StatusBar />
      <HistorySearch />
      <CommandPalette />
    </div>
  );
}

export default App;

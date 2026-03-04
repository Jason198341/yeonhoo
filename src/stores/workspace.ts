import { create } from "zustand";
import { sessionSave } from "@/ipc/session";
import type {
  PaneId,
  TabId,
  TabState,
  PaneTree,
  SplitDirection,
} from "@/types/workspace";

function genId(): string {
  return crypto.randomUUID();
}

function makeLeaf(paneId: PaneId): PaneTree {
  return { type: "leaf", paneId };
}

// Find and replace a leaf node in the tree
function replaceLeaf(
  tree: PaneTree,
  targetId: PaneId,
  replacement: PaneTree,
): PaneTree {
  if (tree.type === "leaf") {
    return tree.paneId === targetId ? replacement : tree;
  }
  return {
    ...tree,
    first: replaceLeaf(tree.first, targetId, replacement),
    second: replaceLeaf(tree.second, targetId, replacement),
  };
}

// Remove a leaf and promote its sibling
function removeLeaf(tree: PaneTree, targetId: PaneId): PaneTree | null {
  if (tree.type === "leaf") {
    return tree.paneId === targetId ? null : tree;
  }
  const firstResult = removeLeaf(tree.first, targetId);
  const secondResult = removeLeaf(tree.second, targetId);

  if (firstResult === null) return secondResult;
  if (secondResult === null) return firstResult;

  return { ...tree, first: firstResult, second: secondResult };
}

// Collect all pane IDs from a tree
function collectPaneIds(tree: PaneTree): PaneId[] {
  if (tree.type === "leaf") return [tree.paneId];
  return [...collectPaneIds(tree.first), ...collectPaneIds(tree.second)];
}

// Find next pane ID in tree (for focus after close)
function findFirstPane(tree: PaneTree): PaneId {
  if (tree.type === "leaf") return tree.paneId;
  return findFirstPane(tree.first);
}

interface WorkspaceStore {
  tabs: TabState[];
  activeTabId: TabId;

  // Tab actions
  addTab: (paneId: PaneId) => TabId;
  removeTab: (tabId: TabId) => PaneId[]; // returns removed pane IDs
  setActiveTab: (tabId: TabId) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  renameTab: (tabId: TabId, title: string) => void;

  // Pane actions
  splitPane: (paneId: PaneId, direction: SplitDirection, newPaneId: PaneId) => void;
  closePane: (paneId: PaneId) => PaneId[]; // returns removed pane IDs (could be whole tab)
  setActivePane: (paneId: PaneId) => void;
  resizeSplit: (paneId: PaneId, ratio: number) => void;

  // Getters
  activeTab: () => TabState | undefined;
  getPaneIds: () => PaneId[];
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  tabs: [],
  activeTabId: "",

  addTab: (paneId: PaneId) => {
    const tabId = genId();
    const tab: TabState = {
      id: tabId,
      title: "Terminal",
      tree: makeLeaf(paneId),
      activePaneId: paneId,
    };
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: tabId,
    }));
    return tabId;
  },

  removeTab: (tabId: TabId) => {
    const state = get();
    const tab = state.tabs.find((t) => t.id === tabId);
    if (!tab) return [];

    const removedPanes = collectPaneIds(tab.tree);
    const remaining = state.tabs.filter((t) => t.id !== tabId);

    if (remaining.length === 0) {
      set({ tabs: [], activeTabId: "" });
    } else {
      const newActiveId =
        state.activeTabId === tabId ? remaining[Math.max(0, remaining.length - 1)].id : state.activeTabId;
      set({ tabs: remaining, activeTabId: newActiveId });
    }
    return removedPanes;
  },

  setActiveTab: (tabId: TabId) => set({ activeTabId: tabId }),

  moveTab: (fromIndex: number, toIndex: number) => {
    set((s) => {
      const tabs = [...s.tabs];
      const [moved] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, moved);
      return { tabs };
    });
  },

  renameTab: (tabId: TabId, title: string) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, title } : t)),
    }));
  },

  splitPane: (paneId: PaneId, direction: SplitDirection, newPaneId: PaneId) => {
    set((s) => ({
      tabs: s.tabs.map((tab) => {
        if (!collectPaneIds(tab.tree).includes(paneId)) return tab;
        const newTree = replaceLeaf(tab.tree, paneId, {
          type: "split",
          direction,
          ratio: 0.5,
          first: makeLeaf(paneId),
          second: makeLeaf(newPaneId),
        });
        return { ...tab, tree: newTree, activePaneId: newPaneId };
      }),
    }));
  },

  closePane: (paneId: PaneId) => {
    const state = get();
    for (const tab of state.tabs) {
      const paneIds = collectPaneIds(tab.tree);
      if (!paneIds.includes(paneId)) continue;

      // Only pane in tab → remove whole tab
      if (paneIds.length === 1) {
        return get().removeTab(tab.id);
      }

      // Remove pane from tree, promote sibling
      const newTree = removeLeaf(tab.tree, paneId);
      if (!newTree) return get().removeTab(tab.id);

      const newActive =
        tab.activePaneId === paneId ? findFirstPane(newTree) : tab.activePaneId;

      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === tab.id ? { ...t, tree: newTree, activePaneId: newActive } : t,
        ),
      }));
      return [paneId];
    }
    return [];
  },

  setActivePane: (paneId: PaneId) => {
    set((s) => ({
      tabs: s.tabs.map((tab) => {
        if (!collectPaneIds(tab.tree).includes(paneId)) return tab;
        return { ...tab, activePaneId: paneId };
      }),
    }));
  },

  resizeSplit: (paneId: PaneId, ratio: number) => {
    const clampedRatio = Math.max(0.1, Math.min(0.9, ratio));
    function updateRatio(tree: PaneTree): PaneTree {
      if (tree.type === "leaf") return tree;
      // If the first child contains the target pane, update this split's ratio
      const firstIds = collectPaneIds(tree.first);
      if (firstIds.includes(paneId)) {
        return { ...tree, ratio: clampedRatio, first: updateRatio(tree.first), second: updateRatio(tree.second) };
      }
      return { ...tree, first: updateRatio(tree.first), second: updateRatio(tree.second) };
    }
    set((s) => ({
      tabs: s.tabs.map((tab) => ({ ...tab, tree: updateRatio(tab.tree) })),
    }));
  },

  activeTab: () => {
    const s = get();
    return s.tabs.find((t) => t.id === s.activeTabId);
  },

  getPaneIds: () => {
    const s = get();
    return s.tabs.flatMap((t) => collectPaneIds(t.tree));
  },
}));

// Auto-save session on workspace changes (debounced)
let saveTimer: ReturnType<typeof setTimeout> | null = null;
useWorkspaceStore.subscribe((state) => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (state.tabs.length > 0) {
      sessionSave({ tabs: state.tabs, activeTabId: state.activeTabId }).catch(
        console.error,
      );
    }
  }, 500);
});

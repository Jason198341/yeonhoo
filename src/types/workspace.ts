// === Workspace Types ===

export type PaneId = string;
export type TabId = string;

export type SplitDirection = "horizontal" | "vertical";

export type PaneTree =
  | { type: "leaf"; paneId: PaneId }
  | {
      type: "split";
      direction: SplitDirection;
      ratio: number; // 0.0 - 1.0
      first: PaneTree;
      second: PaneTree;
    };

export interface PaneState {
  id: PaneId;
  title: string;
  cwd: string;
  isClaudeCode: boolean;
}

export interface TabState {
  id: TabId;
  title: string;
  tree: PaneTree;
  activePaneId: PaneId;
}

export interface WorkspaceState {
  tabs: TabState[];
  activeTabId: TabId;
}

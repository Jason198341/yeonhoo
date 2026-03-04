import { invoke } from "@tauri-apps/api/core";

export interface HistoryEntry {
  id: number;
  command: string;
  cwd: string;
  pane_id: string;
  timestamp: string;
}

export async function historyAdd(command: string, cwd: string, paneId: string): Promise<number> {
  return invoke<number>("history_add", { command, cwd, paneId });
}

export async function historySearch(query: string, limit?: number): Promise<HistoryEntry[]> {
  return invoke<HistoryEntry[]>("history_search", { query, limit: limit ?? null });
}

export async function historyDelete(id: number): Promise<void> {
  return invoke("history_delete", { id });
}

export async function historyClear(): Promise<void> {
  return invoke("history_clear");
}

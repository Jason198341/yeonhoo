import { invoke } from "@tauri-apps/api/core";
import type { TabState } from "@/types/workspace";

interface SessionData {
  tabs: TabState[];
  activeTabId: string;
}

export async function sessionSave(data: SessionData): Promise<void> {
  return invoke("session_save", { data });
}

export async function sessionLoad(): Promise<SessionData | null> {
  return invoke<SessionData | null>("session_load");
}

export async function sessionClear(): Promise<void> {
  return invoke("session_clear");
}

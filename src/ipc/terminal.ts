import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export async function createPane(cwd?: string, shell?: string): Promise<string> {
  return invoke<string>("create_pane", { cwd: cwd ?? null, shell: shell ?? null });
}

export async function terminalInput(paneId: string, data: string): Promise<void> {
  return invoke("terminal_input", { paneId, data });
}

export async function resizePane(paneId: string, cols: number, rows: number): Promise<void> {
  return invoke("resize_pane", { paneId, cols, rows });
}

export async function closePane(paneId: string): Promise<void> {
  return invoke("close_pane", { paneId });
}

export interface TerminalOutputEvent {
  pane_id: string;
  data: string;
}

export interface PaneExitedEvent {
  pane_id: string;
  exit_code: number;
}

export function onTerminalOutput(
  cb: (e: TerminalOutputEvent) => void,
): Promise<UnlistenFn> {
  return listen<TerminalOutputEvent>("terminal-output", (event) => cb(event.payload));
}

export function onPaneExited(
  cb: (e: PaneExitedEvent) => void,
): Promise<UnlistenFn> {
  return listen<PaneExitedEvent>("pane-exited", (event) => cb(event.payload));
}

export async function checkClaude(paneId: string): Promise<boolean> {
  return invoke<boolean>("check_claude", { paneId });
}

export async function getForegroundProcess(paneId: string): Promise<string | null> {
  return invoke<string | null>("get_foreground_process", { paneId });
}

export async function getClipboardFiles(): Promise<string[]> {
  return invoke<string[]>("get_clipboard_files");
}

export async function getClipboardText(): Promise<string | null> {
  return invoke<string | null>("get_clipboard_text");
}

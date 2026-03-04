import { invoke } from "@tauri-apps/api/core";

export interface PluginTheme {
  id: string;
  name: string;
  terminal: Record<string, string>;
  ui: Record<string, string>;
}

export interface PluginCommand {
  name: string;
  description: string;
  syntax: string;
  category: string;
}

export interface PluginKeybinding {
  key: string;
  action: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  themes: PluginTheme[];
  commands: PluginCommand[];
  keybindings: PluginKeybinding[];
}

export async function scanPlugins(): Promise<PluginManifest[]> {
  return invoke<PluginManifest[]>("scan_plugins");
}

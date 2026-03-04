import { invoke } from "@tauri-apps/api/core";

export interface AppConfig {
  appearance: {
    theme: string;
    font_family: string;
    font_size: number;
    cursor_style: string;
    cursor_blink: boolean;
    opacity: number;
  };
  terminal: {
    scrollback: number;
    shell: string | null;
    default_cwd: string | null;
    word_separators: string;
    copy_on_select: boolean;
  };
  claude: {
    auto_detect: boolean;
    poll_interval_ms: number;
    cost_warning_threshold: number;
    autocomplete_enabled: boolean;
  };
  notifications: {
    enabled: boolean;
    permission_prompt: boolean;
    task_complete: boolean;
    error_alert: boolean;
    sound: boolean;
  };
  keybindings: {
    new_tab: string;
    close_tab: string;
    next_tab: string;
    split_horizontal: string;
    split_vertical: string;
    close_pane: string;
  };
}

export async function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>("get_config");
}

export async function setConfig(config: AppConfig): Promise<void> {
  return invoke("set_config", { config });
}

export async function getConfigPath(): Promise<string> {
  return invoke<string>("get_config_path");
}

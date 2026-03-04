use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppConfig {
    pub appearance: AppearanceConfig,
    pub terminal: TerminalConfig,
    pub claude: ClaudeConfig,
    pub notifications: NotificationConfig,
    pub keybindings: KeybindingsConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppearanceConfig {
    pub theme: String,
    pub font_family: String,
    pub font_size: u16,
    pub cursor_style: String,
    pub cursor_blink: bool,
    pub opacity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct TerminalConfig {
    pub scrollback: u32,
    pub shell: Option<String>,
    pub default_cwd: Option<String>,
    pub word_separators: String,
    pub copy_on_select: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct ClaudeConfig {
    pub auto_detect: bool,
    pub poll_interval_ms: u64,
    pub cost_warning_threshold: f64,
    pub autocomplete_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct NotificationConfig {
    pub enabled: bool,
    pub permission_prompt: bool,
    pub task_complete: bool,
    pub error_alert: bool,
    pub sound: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct KeybindingsConfig {
    pub new_tab: String,
    pub close_tab: String,
    pub next_tab: String,
    pub split_horizontal: String,
    pub split_vertical: String,
    pub close_pane: String,
}

// ── Defaults ──

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            appearance: AppearanceConfig::default(),
            terminal: TerminalConfig::default(),
            claude: ClaudeConfig::default(),
            notifications: NotificationConfig::default(),
            keybindings: KeybindingsConfig::default(),
        }
    }
}

impl Default for AppearanceConfig {
    fn default() -> Self {
        Self {
            theme: "yeonhoo-dark".into(),
            font_family: "JetBrains Mono".into(),
            font_size: 14,
            cursor_style: "block".into(),
            cursor_blink: true,
            opacity: 1.0,
        }
    }
}

impl Default for TerminalConfig {
    fn default() -> Self {
        Self {
            scrollback: 10_000,
            shell: None,
            default_cwd: None,
            word_separators: " ()\"',:;<>~!@#$%^&*|+=[]{}~?│".into(),
            copy_on_select: false,
        }
    }
}

impl Default for ClaudeConfig {
    fn default() -> Self {
        Self {
            auto_detect: true,
            poll_interval_ms: 3000,
            cost_warning_threshold: 10.0,
            autocomplete_enabled: true,
        }
    }
}

impl Default for NotificationConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            permission_prompt: true,
            task_complete: true,
            error_alert: true,
            sound: false,
        }
    }
}

impl Default for KeybindingsConfig {
    fn default() -> Self {
        Self {
            new_tab: "Ctrl+Shift+T".into(),
            close_tab: "Ctrl+Shift+W".into(),
            next_tab: "Ctrl+Tab".into(),
            split_horizontal: "Ctrl+Shift+\\".into(),
            split_vertical: "Ctrl+Shift+-".into(),
            close_pane: "Ctrl+Shift+X".into(),
        }
    }
}

use crate::claude::{clipboard, detector};
use crate::config::{AppConfig, ConfigManager};
use crate::history::HistoryDb;
use crate::pty::PtyManager;
use serde::Serialize;
use std::io::Read;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

#[derive(Debug, Serialize, Clone)]
pub struct TerminalOutput {
    pub pane_id: String,
    pub data: String, // base64 or utf8 output
}

#[derive(Debug, Serialize, Clone)]
pub struct PaneExited {
    pub pane_id: String,
    pub exit_code: i32,
}

/// Create a new terminal pane with a PTY
#[tauri::command]
pub fn create_pane(
    app: AppHandle,
    pty_manager: State<'_, Arc<PtyManager>>,
    cwd: Option<String>,
    shell: Option<String>,
) -> Result<String, String> {
    let cwd_path = cwd.map(std::path::PathBuf::from);
    let pane_id = pty_manager.spawn(shell, cwd_path, 80, 24)?;

    // Start reading PTY output in a background thread
    let reader = pty_manager.take_reader(&pane_id)?;
    let pane_id_clone = pane_id.clone();
    let app_clone = app.clone();
    let pty_clone = Arc::clone(&pty_manager);

    std::thread::spawn(move || {
        read_pty_output(reader, &pane_id_clone, &app_clone, pty_clone);
    });

    tracing::info!(pane_id = %pane_id, "Pane created");
    Ok(pane_id)
}

/// Send keyboard input to a pane's PTY
#[tauri::command]
pub fn terminal_input(
    pty_manager: State<'_, Arc<PtyManager>>,
    pane_id: String,
    data: String,
) -> Result<(), String> {
    pty_manager.write_input(&pane_id, data.as_bytes())
}

/// Resize a pane's PTY
#[tauri::command]
pub fn resize_pane(
    pty_manager: State<'_, Arc<PtyManager>>,
    pane_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    pty_manager.resize(&pane_id, cols, rows)
}

/// Close a pane and kill its PTY
#[tauri::command]
pub fn close_pane(pty_manager: State<'_, Arc<PtyManager>>, pane_id: String) -> Result<(), String> {
    pty_manager.close(&pane_id)
}

/// Check if Claude Code is running in a pane's process tree
#[tauri::command]
pub fn check_claude(
    pty_manager: State<'_, Arc<PtyManager>>,
    pane_id: String,
) -> Result<bool, String> {
    match pty_manager.get_child_pid(&pane_id)? {
        Some(pid) => Ok(detector::is_claude_running(pid)),
        None => Ok(false),
    }
}

/// Get the foreground process name for a pane
#[tauri::command]
pub fn get_foreground_process(
    pty_manager: State<'_, Arc<PtyManager>>,
    pane_id: String,
) -> Result<Option<String>, String> {
    match pty_manager.get_child_pid(&pane_id)? {
        Some(pid) => Ok(detector::get_foreground_process(pid)),
        None => Ok(None),
    }
}

/// Get file paths from clipboard (Windows CF_HDROP)
#[tauri::command]
pub fn get_clipboard_files() -> Vec<String> {
    clipboard::get_clipboard_files()
}

/// Get text from clipboard (Windows CF_UNICODETEXT)
#[tauri::command]
pub fn get_clipboard_text() -> Option<String> {
    clipboard::get_clipboard_text()
}

/// Get current config
#[tauri::command]
pub fn get_config(config_manager: State<'_, Arc<ConfigManager>>) -> AppConfig {
    config_manager.get()
}

/// Update config
#[tauri::command]
pub fn set_config(
    config_manager: State<'_, Arc<ConfigManager>>,
    config: AppConfig,
) -> Result<(), String> {
    config_manager.update(config)
}

/// Get config file path (for "open in editor")
#[tauri::command]
pub fn get_config_path(config_manager: State<'_, Arc<ConfigManager>>) -> String {
    config_manager.config_path().to_string_lossy().to_string()
}

/// Add a command to history
#[tauri::command]
pub fn history_add(
    history_db: State<'_, Arc<HistoryDb>>,
    command: String,
    cwd: String,
    pane_id: String,
) -> Result<i64, String> {
    history_db.add(&command, &cwd, &pane_id)
}

/// Search history (empty query = recent commands)
#[tauri::command]
pub fn history_search(
    history_db: State<'_, Arc<HistoryDb>>,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<crate::history::db::HistoryEntry>, String> {
    history_db.search(&query, limit.unwrap_or(50))
}

/// Delete a history entry
#[tauri::command]
pub fn history_delete(
    history_db: State<'_, Arc<HistoryDb>>,
    id: i64,
) -> Result<(), String> {
    history_db.delete(id)
}

/// Clear all history
#[tauri::command]
pub fn history_clear(history_db: State<'_, Arc<HistoryDb>>) -> Result<(), String> {
    history_db.clear()
}

/// Scan and load all plugins from ~/.yeonhoo/plugins/
#[tauri::command]
pub fn scan_plugins() -> Vec<crate::plugin::PluginManifest> {
    crate::plugin::scan_plugins()
}

/// Save session layout
#[tauri::command]
pub fn session_save(data: crate::session::SessionData) -> Result<(), String> {
    crate::session::save(&data)
}

/// Load session layout
#[tauri::command]
pub fn session_load() -> Result<Option<crate::session::SessionData>, String> {
    crate::session::load()
}

/// Clear saved session
#[tauri::command]
pub fn session_clear() -> Result<(), String> {
    crate::session::clear()
}

fn read_pty_output(
    mut reader: Box<dyn Read + Send>,
    pane_id: &str,
    app: &AppHandle,
    pty_manager: Arc<PtyManager>,
) {
    let mut buf = [0u8; 4096];
    loop {
        match reader.read(&mut buf) {
            Ok(0) => {
                // PTY closed
                let _ = app.emit(
                    "pane-exited",
                    PaneExited {
                        pane_id: pane_id.to_string(),
                        exit_code: 0,
                    },
                );
                break;
            }
            Ok(n) => {
                // Convert to string (lossy for non-utf8)
                let text = String::from_utf8_lossy(&buf[..n]).to_string();
                // Write to MCP output buffer
                pty_manager.push_output(pane_id, &text);
                let _ = app.emit(
                    "terminal-output",
                    TerminalOutput {
                        pane_id: pane_id.to_string(),
                        data: text,
                    },
                );
            }
            Err(e) => {
                tracing::error!(pane_id = %pane_id, error = %e, "PTY read error");
                break;
            }
        }
    }
    tracing::info!(pane_id = %pane_id, "PTY reader stopped");
}

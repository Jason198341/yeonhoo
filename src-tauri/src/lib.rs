mod claude;
mod config;
mod history;
mod ipc;
pub mod plugin;
mod pty;
pub mod session;
mod terminal;

use config::ConfigManager;
use history::HistoryDb;
use pty::PtyManager;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    let pty_manager = Arc::new(PtyManager::new());
    let config_manager = Arc::new(ConfigManager::new());
    let history_db = Arc::new(HistoryDb::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .manage(pty_manager)
        .manage(config_manager)
        .manage(history_db)
        .invoke_handler(tauri::generate_handler![
            ipc::create_pane,
            ipc::terminal_input,
            ipc::resize_pane,
            ipc::close_pane,
            ipc::check_claude,
            ipc::get_foreground_process,
            ipc::get_clipboard_files,
            ipc::get_clipboard_text,
            ipc::get_config,
            ipc::set_config,
            ipc::get_config_path,
            ipc::history_add,
            ipc::history_search,
            ipc::history_delete,
            ipc::history_clear,
            ipc::session_save,
            ipc::session_load,
            ipc::session_clear,
            ipc::scan_plugins,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use parking_lot::Mutex;
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::Arc;
use uuid::Uuid;

pub type PaneId = String;

pub struct PtyInstance {
    pub master: Box<dyn MasterPty + Send>,
    pub writer: Box<dyn Write + Send>,
    pub child: Box<dyn portable_pty::Child + Send>,
    pub cols: u16,
    pub rows: u16,
}

pub struct PtyManager {
    instances: Arc<Mutex<HashMap<PaneId, PtyInstance>>>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            instances: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn spawn(
        &self,
        shell: Option<String>,
        cwd: Option<PathBuf>,
        cols: u16,
        rows: u16,
    ) -> Result<PaneId, String> {
        let pty_system = native_pty_system();

        let size = PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        };

        let pair = pty_system
            .openpty(size)
            .map_err(|e| format!("Failed to open PTY: {}", e))?;

        let shell_path = shell.unwrap_or_else(|| detect_shell());

        let mut cmd = CommandBuilder::new(&shell_path);
        if let Some(dir) = cwd {
            cmd.cwd(dir);
        }

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Failed to spawn shell: {}", e))?;

        let writer = pair
            .master
            .take_writer()
            .map_err(|e| format!("Failed to get PTY writer: {}", e))?;

        let pane_id = Uuid::new_v4().to_string();

        let instance = PtyInstance {
            master: pair.master,
            writer,
            child,
            cols,
            rows,
        };

        self.instances.lock().insert(pane_id.clone(), instance);
        Ok(pane_id)
    }

    pub fn write_input(&self, pane_id: &str, data: &[u8]) -> Result<(), String> {
        let mut instances = self.instances.lock();
        let instance = instances
            .get_mut(pane_id)
            .ok_or_else(|| format!("Pane {} not found", pane_id))?;
        instance
            .writer
            .write_all(data)
            .map_err(|e| format!("Write error: {}", e))?;
        instance
            .writer
            .flush()
            .map_err(|e| format!("Flush error: {}", e))?;
        Ok(())
    }

    pub fn resize(&self, pane_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let mut instances = self.instances.lock();
        let instance = instances
            .get_mut(pane_id)
            .ok_or_else(|| format!("Pane {} not found", pane_id))?;

        let size = PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        };

        instance
            .master
            .resize(size)
            .map_err(|e| format!("Resize error: {}", e))?;
        instance.cols = cols;
        instance.rows = rows;
        Ok(())
    }

    pub fn close(&self, pane_id: &str) -> Result<(), String> {
        let mut instances = self.instances.lock();
        if let Some(mut instance) = instances.remove(pane_id) {
            let _ = instance.child.kill();
        }
        Ok(())
    }

    pub fn take_reader(&self, pane_id: &str) -> Result<Box<dyn Read + Send>, String> {
        let instances = self.instances.lock();
        let instance = instances
            .get(pane_id)
            .ok_or_else(|| format!("Pane {} not found", pane_id))?;
        instance
            .master
            .try_clone_reader()
            .map_err(|e| format!("Failed to clone reader: {}", e))
    }

    pub fn pane_count(&self) -> usize {
        self.instances.lock().len()
    }

    /// Get the shell child process ID for a pane
    pub fn get_child_pid(&self, pane_id: &str) -> Result<Option<u32>, String> {
        let instances = self.instances.lock();
        let instance = instances
            .get(pane_id)
            .ok_or_else(|| format!("Pane {} not found", pane_id))?;
        Ok(instance.child.process_id())
    }
}

fn detect_shell() -> String {
    if cfg!(target_os = "windows") {
        // Prefer PowerShell, fall back to cmd
        if let Ok(ps) = std::process::Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg("echo ok")
            .output()
        {
            if ps.status.success() {
                return "powershell".to_string();
            }
        }
        "cmd".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
    }
}

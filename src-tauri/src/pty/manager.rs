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
    output_buffers: Arc<Mutex<HashMap<PaneId, String>>>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            instances: Arc::new(Mutex::new(HashMap::new())),
            output_buffers: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Append PTY output to the API buffer (called from read thread)
    pub fn push_output(&self, pane_id: &str, data: &str) {
        let mut bufs = self.output_buffers.lock();
        let buf = bufs.entry(pane_id.to_string()).or_insert_with(String::new);
        // Cap buffer at 1MB; if exceeded, keep last 512KB
        if buf.len() + data.len() > 1_048_576 {
            let keep = buf.len().saturating_sub(524_288);
            *buf = buf[keep..].to_string();
        }
        buf.push_str(data);
    }

    /// Drain and return all buffered output for a pane (clears buffer)
    pub fn drain_output(&self, pane_id: &str) -> String {
        let mut bufs = self.output_buffers.lock();
        std::mem::take(bufs.entry(pane_id.to_string()).or_insert_with(String::new))
    }

    /// List all active pane IDs
    pub fn get_pane_ids(&self) -> Vec<PaneId> {
        self.instances.lock().keys().cloned().collect()
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
        // Prevent Claude Code nested-session error — child shell must not inherit this
        cmd.env_remove("CLAUDECODE");

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
        self.output_buffers.lock().remove(pane_id);
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
        // 1. Git Bash (most compatible — no ExecutionPolicy issues)
        let git_bash_paths = [
            "C:\\Program Files\\Git\\bin\\bash.exe",
            "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
        ];
        for path in &git_bash_paths {
            if std::path::Path::new(path).exists() {
                tracing::info!(shell = %path, "Using Git Bash");
                return path.to_string();
            }
        }

        // 2. MSYS2 bash
        let msys2_paths = [
            "C:\\msys64\\usr\\bin\\bash.exe",
            "C:\\msys2\\usr\\bin\\bash.exe",
        ];
        for path in &msys2_paths {
            if std::path::Path::new(path).exists() {
                tracing::info!(shell = %path, "Using MSYS2 bash");
                return path.to_string();
            }
        }

        // 3. PowerShell — only if ExecutionPolicy allows scripts
        if let Ok(ps) = std::process::Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg("Get-ExecutionPolicy")
            .output()
        {
            if ps.status.success() {
                let policy = String::from_utf8_lossy(&ps.stdout).trim().to_lowercase();
                if policy != "restricted" {
                    tracing::info!(policy = %policy, "Using PowerShell");
                    return "powershell".to_string();
                }
                tracing::warn!(policy = %policy, "PowerShell ExecutionPolicy is Restricted, falling back to cmd");
            }
        }

        // 4. cmd.exe (always works)
        tracing::info!("Using cmd.exe");
        "cmd".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
    }
}

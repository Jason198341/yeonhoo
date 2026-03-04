use std::collections::HashMap;
use sysinfo::{Process, System};

/// Check if a claude/claude-code process exists in the process tree of the given PID.
pub fn is_claude_running(shell_pid: u32) -> bool {
    let mut sys = System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let target_pid = sysinfo::Pid::from_u32(shell_pid);
    let processes = sys.processes();

    // Build parent→children map
    let mut children_map: HashMap<sysinfo::Pid, Vec<sysinfo::Pid>> = HashMap::new();
    for (pid, proc_info) in processes {
        if let Some(parent) = proc_info.parent() {
            children_map.entry(parent).or_default().push(*pid);
        }
    }

    has_claude_child(target_pid, &children_map, processes)
}

fn has_claude_child(
    pid: sysinfo::Pid,
    children_map: &HashMap<sysinfo::Pid, Vec<sysinfo::Pid>>,
    processes: &HashMap<sysinfo::Pid, Process>,
) -> bool {
    if let Some(children) = children_map.get(&pid) {
        for &child_pid in children {
            if let Some(proc_info) = processes.get(&child_pid) {
                let name = proc_info.name().to_string_lossy().to_lowercase();
                if name.contains("claude") {
                    return true;
                }
            }
            if has_claude_child(child_pid, children_map, processes) {
                return true;
            }
        }
    }
    false
}

/// Get the foreground process name for a given shell PID.
/// Returns the deepest child process name.
pub fn get_foreground_process(shell_pid: u32) -> Option<String> {
    let mut sys = System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let target_pid = sysinfo::Pid::from_u32(shell_pid);
    let processes = sys.processes();

    // Build parent→children map
    let mut children_map: HashMap<sysinfo::Pid, Vec<sysinfo::Pid>> = HashMap::new();
    for (pid, proc_info) in processes {
        if let Some(parent) = proc_info.parent() {
            children_map.entry(parent).or_default().push(*pid);
        }
    }

    deepest_child(target_pid, &children_map, processes)
}

fn deepest_child(
    pid: sysinfo::Pid,
    children_map: &HashMap<sysinfo::Pid, Vec<sysinfo::Pid>>,
    processes: &HashMap<sysinfo::Pid, Process>,
) -> Option<String> {
    if let Some(children) = children_map.get(&pid) {
        if let Some(&child_pid) = children.last() {
            if let Some(deeper) = deepest_child(child_pid, children_map, processes) {
                return Some(deeper);
            }
            if let Some(proc_info) = processes.get(&child_pid) {
                return Some(proc_info.name().to_string_lossy().to_string());
            }
        }
    }
    None
}

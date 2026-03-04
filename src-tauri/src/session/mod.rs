#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum PaneTree {
    #[serde(rename = "leaf")]
    Leaf { paneId: String },
    #[serde(rename = "split")]
    Split {
        direction: String,
        ratio: f64,
        first: Box<PaneTree>,
        second: Box<PaneTree>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabState {
    pub id: String,
    pub title: String,
    pub tree: PaneTree,
    pub activePaneId: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionData {
    pub tabs: Vec<TabState>,
    pub activeTabId: String,
}

fn session_path() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join(".yeonhoo").join("session.json")
}

pub fn save(data: &SessionData) -> Result<(), String> {
    let path = session_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

pub fn load() -> Result<Option<SessionData>, String> {
    let path = session_path();
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let data: SessionData = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    if data.tabs.is_empty() {
        return Ok(None);
    }
    Ok(Some(data))
}

pub fn clear() -> Result<(), String> {
    let path = session_path();
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

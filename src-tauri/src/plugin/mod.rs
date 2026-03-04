#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub themes: Vec<PluginTheme>,
    #[serde(default)]
    pub commands: Vec<PluginCommand>,
    #[serde(default)]
    pub keybindings: Vec<PluginKeybinding>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginTheme {
    pub id: String,
    pub name: String,
    pub terminal: serde_json::Value,
    pub ui: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginCommand {
    pub name: String,
    pub description: String,
    #[serde(default)]
    pub syntax: String,
    #[serde(default)]
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginKeybinding {
    pub key: String,
    pub action: String,
}

fn plugins_dir() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join(".yeonhoo").join("plugins")
}

pub fn scan_plugins() -> Vec<PluginManifest> {
    let dir = plugins_dir();
    if !dir.exists() {
        // Create the plugins directory for discoverability
        let _ = fs::create_dir_all(&dir);
        return Vec::new();
    }

    let mut plugins = Vec::new();

    let entries = match fs::read_dir(&dir) {
        Ok(e) => e,
        Err(_) => return plugins,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let manifest_path = path.join("plugin.json");
        if !manifest_path.exists() {
            continue;
        }

        match fs::read_to_string(&manifest_path) {
            Ok(content) => match serde_json::from_str::<PluginManifest>(&content) {
                Ok(manifest) => {
                    tracing::info!(plugin = %manifest.id, "Loaded plugin");
                    plugins.push(manifest);
                }
                Err(e) => {
                    tracing::warn!(path = %manifest_path.display(), error = %e, "Invalid plugin manifest");
                }
            },
            Err(e) => {
                tracing::warn!(path = %manifest_path.display(), error = %e, "Failed to read plugin manifest");
            }
        }
    }

    plugins
}

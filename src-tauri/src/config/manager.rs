use super::schema::AppConfig;
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use parking_lot::RwLock;
use std::path::PathBuf;
use std::sync::Arc;

pub struct ConfigManager {
    config: Arc<RwLock<AppConfig>>,
    config_path: PathBuf,
    _watcher: Option<RecommendedWatcher>,
}

impl ConfigManager {
    pub fn new() -> Self {
        let config_dir = dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(".yeonhoo");

        std::fs::create_dir_all(&config_dir).ok();
        let config_path = config_dir.join("config.toml");

        let config = Self::load_or_default(&config_path);
        let config = Arc::new(RwLock::new(config));

        let mut manager = Self {
            config,
            config_path,
            _watcher: None,
        };
        manager.start_watcher();
        manager
    }

    fn load_or_default(path: &PathBuf) -> AppConfig {
        if path.exists() {
            match std::fs::read_to_string(path) {
                Ok(content) => match toml::from_str::<AppConfig>(&content) {
                    Ok(config) => {
                        tracing::info!("Config loaded from {:?}", path);
                        return config;
                    }
                    Err(e) => {
                        tracing::warn!("Config parse error, using defaults: {}", e);
                    }
                },
                Err(e) => {
                    tracing::warn!("Config read error, using defaults: {}", e);
                }
            }
        } else {
            // Write default config file
            let default = AppConfig::default();
            if let Ok(content) = toml::to_string_pretty(&default) {
                std::fs::write(path, &content).ok();
                tracing::info!("Default config written to {:?}", path);
            }
        }
        AppConfig::default()
    }

    fn start_watcher(&mut self) {
        let config_path = self.config_path.clone();
        let config = self.config.clone();

        let watcher = notify::recommended_watcher(move |res: Result<Event, _>| {
            if let Ok(event) = res {
                if matches!(event.kind, EventKind::Modify(_)) {
                    if let Ok(content) = std::fs::read_to_string(&config_path) {
                        match toml::from_str::<AppConfig>(&content) {
                            Ok(new_config) => {
                                *config.write() = new_config;
                                tracing::info!("Config hot-reloaded");
                            }
                            Err(e) => {
                                tracing::warn!("Config reload parse error: {}", e);
                            }
                        }
                    }
                }
            }
        });

        match watcher {
            Ok(mut w) => {
                if let Some(parent) = self.config_path.parent() {
                    w.watch(parent, RecursiveMode::NonRecursive).ok();
                }
                self._watcher = Some(w);
            }
            Err(e) => {
                tracing::warn!("File watcher failed: {}", e);
            }
        }
    }

    pub fn get(&self) -> AppConfig {
        self.config.read().clone()
    }

    pub fn update(&self, new_config: AppConfig) -> Result<(), String> {
        let content = toml::to_string_pretty(&new_config)
            .map_err(|e| format!("Serialize error: {}", e))?;
        std::fs::write(&self.config_path, &content)
            .map_err(|e| format!("Write error: {}", e))?;
        *self.config.write() = new_config;
        Ok(())
    }

    pub fn config_path(&self) -> &PathBuf {
        &self.config_path
    }
}

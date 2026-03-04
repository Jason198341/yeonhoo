use parking_lot::Mutex;
use rusqlite::{params, Connection};
use serde::Serialize;
use std::path::PathBuf;

#[derive(Debug, Serialize, Clone)]
pub struct HistoryEntry {
    pub id: i64,
    pub command: String,
    pub cwd: String,
    pub pane_id: String,
    pub timestamp: String,
}

pub struct HistoryDb {
    conn: Mutex<Connection>,
}

impl HistoryDb {
    pub fn new() -> Self {
        let db_dir = dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(".yeonhoo");
        std::fs::create_dir_all(&db_dir).ok();
        let db_path = db_dir.join("history.db");

        let conn = Connection::open(&db_path).expect("Failed to open history DB");

        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS history (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                command   TEXT NOT NULL,
                cwd       TEXT NOT NULL DEFAULT '',
                pane_id   TEXT NOT NULL DEFAULT '',
                timestamp TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );

            CREATE VIRTUAL TABLE IF NOT EXISTS history_fts USING fts5(
                command,
                content='history',
                content_rowid='id'
            );

            CREATE TRIGGER IF NOT EXISTS history_ai AFTER INSERT ON history BEGIN
                INSERT INTO history_fts(rowid, command) VALUES (new.id, new.command);
            END;

            CREATE TRIGGER IF NOT EXISTS history_ad AFTER DELETE ON history BEGIN
                INSERT INTO history_fts(history_fts, rowid, command) VALUES ('delete', old.id, old.command);
            END;
            ",
        )
        .expect("Failed to create history tables");

        tracing::info!("History DB opened at {:?}", db_path);
        Self {
            conn: Mutex::new(conn),
        }
    }

    pub fn add(&self, command: &str, cwd: &str, pane_id: &str) -> Result<i64, String> {
        let trimmed = command.trim();
        if trimmed.is_empty() {
            return Ok(0);
        }
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO history (command, cwd, pane_id) VALUES (?1, ?2, ?3)",
            params![trimmed, cwd, pane_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(conn.last_insert_rowid())
    }

    pub fn search(&self, query: &str, limit: usize) -> Result<Vec<HistoryEntry>, String> {
        let conn = self.conn.lock();
        if query.trim().is_empty() {
            // Return recent commands
            let mut stmt = conn
                .prepare(
                    "SELECT id, command, cwd, pane_id, timestamp FROM history ORDER BY id DESC LIMIT ?1",
                )
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map(params![limit], |row| {
                    Ok(HistoryEntry {
                        id: row.get(0)?,
                        command: row.get(1)?,
                        cwd: row.get(2)?,
                        pane_id: row.get(3)?,
                        timestamp: row.get(4)?,
                    })
                })
                .map_err(|e| e.to_string())?;
            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        } else {
            // FTS5 search
            let fts_query = format!("\"{}\"*", query.replace('"', "\"\""));
            let mut stmt = conn
                .prepare(
                    "SELECT h.id, h.command, h.cwd, h.pane_id, h.timestamp
                     FROM history_fts f
                     JOIN history h ON h.id = f.rowid
                     WHERE history_fts MATCH ?1
                     ORDER BY h.id DESC
                     LIMIT ?2",
                )
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map(params![fts_query, limit], |row| {
                    Ok(HistoryEntry {
                        id: row.get(0)?,
                        command: row.get(1)?,
                        cwd: row.get(2)?,
                        pane_id: row.get(3)?,
                        timestamp: row.get(4)?,
                    })
                })
                .map_err(|e| e.to_string())?;
            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        }
    }

    pub fn delete(&self, id: i64) -> Result<(), String> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM history WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn clear(&self) -> Result<(), String> {
        let conn = self.conn.lock();
        conn.execute_batch("DELETE FROM history; DELETE FROM history_fts;")
            .map_err(|e| e.to_string())
    }
}

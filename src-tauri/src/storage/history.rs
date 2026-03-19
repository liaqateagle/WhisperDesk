use crate::stt::whisper::{Segment, TranscriptionResult};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryStats {
    pub total_files: i64,
    pub total_hours: f64,
    pub total_words: i64,
}

impl Database {
    pub fn new(app_data_dir: &Path) -> Result<Self, String> {
        std::fs::create_dir_all(app_data_dir).ok();
        let db_path = app_data_dir.join("whisperdesk.db");

        let conn =
            Connection::open(&db_path).map_err(|e| format!("Failed to open database: {}", e))?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS transcriptions (
                id TEXT PRIMARY KEY,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                duration REAL NOT NULL,
                segments_json TEXT NOT NULL,
                full_text TEXT NOT NULL,
                engine TEXT NOT NULL,
                model TEXT NOT NULL,
                language TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );",
        )
        .map_err(|e| format!("Failed to create tables: {}", e))?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn save_transcription(&self, result: &TranscriptionResult) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        let segments_json = serde_json::to_string(&result.segments)
            .map_err(|e| format!("Serialize error: {}", e))?;

        conn.execute(
            "INSERT OR REPLACE INTO transcriptions (id, file_name, file_path, duration, segments_json, full_text, engine, model, language, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                result.id,
                result.file_name,
                result.file_path,
                result.duration,
                segments_json,
                result.full_text,
                result.engine,
                result.model,
                result.language,
                result.created_at,
            ],
        )
        .map_err(|e| format!("Insert error: {}", e))?;

        Ok(())
    }

    pub fn get_history(&self) -> Result<Vec<TranscriptionResult>, String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        let mut stmt = conn
            .prepare(
                "SELECT id, file_name, file_path, duration, segments_json, full_text, engine, model, language, created_at
                 FROM transcriptions ORDER BY created_at DESC",
            )
            .map_err(|e| format!("Query error: {}", e))?;

        let results = stmt
            .query_map([], |row| {
                let segments_json: String = row.get(4)?;
                let segments: Vec<Segment> =
                    serde_json::from_str(&segments_json).unwrap_or_default();

                Ok(TranscriptionResult {
                    id: row.get(0)?,
                    file_name: row.get(1)?,
                    file_path: row.get(2)?,
                    duration: row.get(3)?,
                    segments,
                    full_text: row.get(5)?,
                    engine: row.get(6)?,
                    model: row.get(7)?,
                    language: row.get(8)?,
                    created_at: row.get(9)?,
                })
            })
            .map_err(|e| format!("Query map error: {}", e))?;

        let mut history = Vec::new();
        for result in results {
            if let Ok(r) = result {
                history.push(r);
            }
        }

        Ok(history)
    }

    pub fn get_transcript(&self, id: &str) -> Result<TranscriptionResult, String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        let mut stmt = conn
            .prepare(
                "SELECT id, file_name, file_path, duration, segments_json, full_text, engine, model, language, created_at
                 FROM transcriptions WHERE id = ?1",
            )
            .map_err(|e| format!("Query error: {}", e))?;

        stmt.query_row(params![id], |row| {
            let segments_json: String = row.get(4)?;
            let segments: Vec<Segment> = serde_json::from_str(&segments_json).unwrap_or_default();

            Ok(TranscriptionResult {
                id: row.get(0)?,
                file_name: row.get(1)?,
                file_path: row.get(2)?,
                duration: row.get(3)?,
                segments,
                full_text: row.get(5)?,
                engine: row.get(6)?,
                model: row.get(7)?,
                language: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| format!("Not found: {}", e))
    }

    pub fn delete_transcript(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        conn.execute("DELETE FROM transcriptions WHERE id = ?1", params![id])
            .map_err(|e| format!("Delete error: {}", e))?;
        Ok(())
    }

    pub fn clear_history(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        conn.execute("DELETE FROM transcriptions", [])
            .map_err(|e| format!("Clear error: {}", e))?;
        Ok(())
    }

    pub fn get_stats(&self) -> Result<HistoryStats, String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        let mut stmt = conn
            .prepare(
                "SELECT COUNT(*), COALESCE(SUM(duration), 0), COALESCE(SUM(LENGTH(full_text) - LENGTH(REPLACE(full_text, ' ', '')) + 1), 0) FROM transcriptions",
            )
            .map_err(|e| format!("Query error: {}", e))?;

        stmt.query_row([], |row| {
            Ok(HistoryStats {
                total_files: row.get(0)?,
                total_hours: row.get::<_, f64>(1)? / 3600.0,
                total_words: row.get(2)?,
            })
        })
        .map_err(|e| format!("Stats error: {}", e))
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        let mut stmt = conn
            .prepare("SELECT value FROM settings WHERE key = ?1")
            .map_err(|e| format!("Query error: {}", e))?;

        match stmt.query_row(params![key], |row| row.get(0)) {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(format!("Settings error: {}", e)),
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| format!("Lock error: {}", e))?;
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )
        .map_err(|e| format!("Settings error: {}", e))?;
        Ok(())
    }
}

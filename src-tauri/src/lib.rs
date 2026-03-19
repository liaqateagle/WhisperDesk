mod audio;
mod export;
mod models;
mod storage;
mod stt;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use storage::history::Database;
use tauri::{Manager, State};

struct AppState {
    db: Database,
    app_data_dir: PathBuf,
}

// ──────────────────────────────────────────────
// Transcription
// ──────────────────────────────────────────────

#[tauri::command]
fn transcribe_file(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    file_path: String,
    model_name: String,
    language: String,
) -> Result<stt::whisper::TranscriptionResult, String> {
    // Check model exists
    let model_path = models::manager::model_path(&state.app_data_dir, &model_name);
    if !model_path.exists() {
        return Err(format!("Model '{}' not downloaded. Please download it first.", model_name));
    }

    // Load audio
    let (samples, _sample_rate, duration) = audio::load_audio(&file_path)?;

    // Get file name from path
    let file_name = std::path::Path::new(&file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    // Transcribe
    let result = stt::whisper::transcribe(
        &app,
        model_path.to_str().unwrap_or_default(),
        &samples,
        duration,
        &file_name,
        &file_path,
        &language,
        &model_name,
    )?;

    // Save to history
    state.db.save_transcription(&result)?;

    Ok(result)
}

// ──────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────

#[tauri::command]
fn list_models(state: State<'_, AppState>) -> Vec<models::manager::ModelInfo> {
    models::manager::list_models(&state.app_data_dir)
}

#[tauri::command]
async fn download_model(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    model_name: String,
) -> Result<(), String> {
    models::downloader::download_model(&app, &state.app_data_dir, &model_name).await
}

#[tauri::command]
fn delete_model(state: State<'_, AppState>, model_name: String) -> Result<(), String> {
    models::manager::delete_model(&state.app_data_dir, &model_name)
}

// ──────────────────────────────────────────────
// Export
// ──────────────────────────────────────────────

#[tauri::command]
fn export_transcript(
    format: String,
    segments: Vec<stt::whisper::Segment>,
    full_text: String,
    output_path: String,
) -> Result<(), String> {
    let content = export::export(&format, &segments, &full_text)?;
    std::fs::write(&output_path, content).map_err(|e| format!("Failed to write file: {}", e))
}

// ──────────────────────────────────────────────
// History
// ──────────────────────────────────────────────

#[tauri::command]
fn get_history(
    state: State<'_, AppState>,
) -> Result<Vec<stt::whisper::TranscriptionResult>, String> {
    state.db.get_history()
}

#[tauri::command]
fn get_transcript(
    state: State<'_, AppState>,
    id: String,
) -> Result<stt::whisper::TranscriptionResult, String> {
    state.db.get_transcript(&id)
}

#[tauri::command]
fn delete_transcript(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state.db.delete_transcript(&id)
}

#[tauri::command]
fn clear_history(state: State<'_, AppState>) -> Result<(), String> {
    state.db.clear_history()
}

#[tauri::command]
fn get_stats(state: State<'_, AppState>) -> Result<storage::history::HistoryStats, String> {
    state.db.get_stats()
}

// ──────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AppSettings {
    default_model: String,
    language: String,
    theme: String,
    default_export_format: String,
    speakdock_banner_dismissed: bool,
}

#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let db = &state.db;
    Ok(AppSettings {
        default_model: db
            .get_setting("default_model")?
            .unwrap_or_else(|| "base".to_string()),
        language: db
            .get_setting("language")?
            .unwrap_or_else(|| "auto".to_string()),
        theme: db
            .get_setting("theme")?
            .unwrap_or_else(|| "dark".to_string()),
        default_export_format: db
            .get_setting("default_export_format")?
            .unwrap_or_else(|| "srt".to_string()),
        speakdock_banner_dismissed: db
            .get_setting("speakdock_banner_dismissed")?
            .map(|v| v == "true")
            .unwrap_or(false),
    })
}

#[tauri::command]
fn save_settings(state: State<'_, AppState>, settings: AppSettings) -> Result<(), String> {
    let db = &state.db;
    db.set_setting("default_model", &settings.default_model)?;
    db.set_setting("language", &settings.language)?;
    db.set_setting("theme", &settings.theme)?;
    db.set_setting("default_export_format", &settings.default_export_format)?;
    db.set_setting(
        "speakdock_banner_dismissed",
        if settings.speakdock_banner_dismissed {
            "true"
        } else {
            "false"
        },
    )?;
    Ok(())
}

// ──────────────────────────────────────────────
// App entry
// ──────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");

            let db = Database::new(&app_data_dir).expect("Failed to initialize database");

            app.manage(AppState {
                db,
                app_data_dir,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            transcribe_file,
            list_models,
            download_model,
            delete_model,
            export_transcript,
            get_history,
            get_transcript,
            delete_transcript,
            clear_history,
            get_stats,
            get_settings,
            save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

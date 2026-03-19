use futures_util::StreamExt;
use std::path::Path;
use tauri::{AppHandle, Emitter};

const BASE_URL: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";

/// Download a whisper model from HuggingFace with progress events
pub async fn download_model(
    app: &AppHandle,
    app_data_dir: &Path,
    model_name: &str,
) -> Result<(), String> {
    let url = format!("{}/ggml-{}.bin", BASE_URL, model_name);
    let output_path = super::manager::model_path(app_data_dir, model_name);

    // Create models directory
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("Failed to create dir: {}", e))?;
    }

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to start download: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download failed with status: {}", response.status()));
    }

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;

    let mut file = tokio::fs::File::create(&output_path)
        .await
        .map_err(|e| format!("Failed to create file: {}", e))?;

    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Download error: {}", e))?;

        use tokio::io::AsyncWriteExt;
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("Write error: {}", e))?;

        downloaded += chunk.len() as u64;

        let progress = if total_size > 0 {
            (downloaded as f64 / total_size as f64) * 100.0
        } else {
            0.0
        };

        let _ = app.emit(
            "model-download-progress",
            serde_json::json!({
                "model": model_name,
                "progress": progress,
                "downloaded": downloaded,
                "total": total_size,
            }),
        );
    }

    Ok(())
}

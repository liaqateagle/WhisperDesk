use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub size: String,
    pub downloaded: bool,
}

pub const AVAILABLE_MODELS: &[(&str, &str)] = &[
    ("tiny", "75 MB"),
    ("base", "142 MB"),
    ("small", "466 MB"),
    ("medium", "1.5 GB"),
    ("large-v3", "3.1 GB"),
    ("large-v3-turbo", "1.6 GB"),
];

/// Get the models directory (app_data/models)
pub fn models_dir(app_data_dir: &Path) -> PathBuf {
    let dir = app_data_dir.join("models");
    std::fs::create_dir_all(&dir).ok();
    dir
}

/// Get the path for a specific model file
pub fn model_path(app_data_dir: &Path, name: &str) -> PathBuf {
    models_dir(app_data_dir).join(format!("ggml-{}.bin", name))
}

/// Check if a model is downloaded
pub fn is_downloaded(app_data_dir: &Path, name: &str) -> bool {
    model_path(app_data_dir, name).exists()
}

/// List all models with their download status
pub fn list_models(app_data_dir: &Path) -> Vec<ModelInfo> {
    AVAILABLE_MODELS
        .iter()
        .map(|(name, size)| ModelInfo {
            name: name.to_string(),
            size: size.to_string(),
            downloaded: is_downloaded(app_data_dir, name),
        })
        .collect()
}

/// Delete a downloaded model
pub fn delete_model(app_data_dir: &Path, name: &str) -> Result<(), String> {
    let path = model_path(app_data_dir, name);
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| format!("Failed to delete model: {}", e))?;
    }
    Ok(())
}

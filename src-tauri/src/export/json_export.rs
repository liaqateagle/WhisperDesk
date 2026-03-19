use crate::stt::whisper::Segment;

pub fn export(segments: &[Segment]) -> Result<String, String> {
    serde_json::to_string_pretty(segments).map_err(|e| format!("JSON serialization error: {}", e))
}

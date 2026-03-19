pub mod srt;
pub mod vtt;
pub mod txt;
pub mod json_export;
pub mod markdown;

use crate::stt::whisper::Segment;

pub fn export(format: &str, segments: &[Segment], full_text: &str) -> Result<String, String> {
    match format {
        "srt" => Ok(srt::export(segments)),
        "vtt" => Ok(vtt::export(segments)),
        "txt" => Ok(txt::export(full_text)),
        "json" => json_export::export(segments),
        "markdown" => Ok(markdown::export(segments)),
        _ => Err(format!("Unknown export format: {}", format)),
    }
}

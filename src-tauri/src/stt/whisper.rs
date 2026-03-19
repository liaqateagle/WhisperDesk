use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordTimestamp {
    pub word: String,
    pub start: f64, // seconds
    pub end: f64,   // seconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Segment {
    pub start: f64,
    pub end: f64,
    pub text: String,
    pub words: Vec<WordTimestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscriptionResult {
    pub id: String,
    pub file_name: String,
    pub file_path: String,
    pub duration: f64,
    pub segments: Vec<Segment>,
    pub full_text: String,
    pub engine: String,
    pub model: String,
    pub language: String,
    pub created_at: String,
}

pub fn transcribe(
    app: &AppHandle,
    model_path: &str,
    samples: &[f32],
    duration: f64,
    file_name: &str,
    file_path: &str,
    language: &str,
    model_name: &str,
) -> Result<TranscriptionResult, String> {
    let _ = app.emit(
        "transcription-progress",
        serde_json::json!({ "progress": 5.0, "status": "Loading model..." }),
    );

    let ctx = WhisperContext::new_with_params(model_path, WhisperContextParameters::default())
        .map_err(|e| format!("Failed to load whisper model: {}", e))?;

    let _ = app.emit(
        "transcription-progress",
        serde_json::json!({ "progress": 15.0, "status": "Model loaded. Starting transcription..." }),
    );

    let mut state = ctx
        .create_state()
        .map_err(|e| format!("Failed to create state: {}", e))?;

    let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });

    // Enable token-level timestamps for word-level output
    params.set_token_timestamps(true);
    params.set_max_len(1);

    if language != "auto" {
        params.set_language(Some(language));
    }

    params.set_print_special(false);
    params.set_print_progress(false);
    params.set_print_realtime(false);
    params.set_print_timestamps(false);

    // Run transcription
    state
        .full(params, samples)
        .map_err(|e| format!("Transcription failed: {}", e))?;

    let _ = app.emit(
        "transcription-progress",
        serde_json::json!({ "progress": 80.0, "status": "Processing results..." }),
    );

    // Extract segments and word-level timestamps using the new API
    let num_segments = state.full_n_segments();

    let mut segments: Vec<Segment> = Vec::new();
    let mut all_text = String::new();

    let mut current_segment_words: Vec<WordTimestamp> = Vec::new();
    let mut segment_start: Option<f64> = None;
    let segment_duration = 30.0; // group words into ~30s segments

    for i in 0..num_segments {
        let seg = match state.get_segment(i) {
            Some(s) => s,
            None => continue,
        };

        let seg_start_cs = seg.start_timestamp(); // centiseconds
        let seg_end_cs = seg.end_timestamp();
        let seg_start_s = seg_start_cs as f64 / 100.0;
        let seg_end_s = seg_end_cs as f64 / 100.0;

        let num_tokens = seg.n_tokens();

        for t in 0..num_tokens {
            let token = match seg.get_token(t) {
                Some(tk) => tk,
                None => continue,
            };

            let word = match token.to_str_lossy() {
                Ok(s) => s.trim().to_string(),
                Err(_) => continue,
            };

            if word.is_empty() || word.starts_with('[') || word.starts_with('<') {
                continue;
            }

            let token_data = token.token_data();
            let word_start = token_data.t0 as f64 * 0.01;
            let word_end = token_data.t1 as f64 * 0.01;

            if segment_start.is_none() {
                segment_start = Some(word_start);
            }

            current_segment_words.push(WordTimestamp {
                word,
                start: word_start,
                end: word_end,
            });
        }

        // Close segment group every ~30 seconds or at the end
        let should_close = if let Some(start) = segment_start {
            seg_end_s - start >= segment_duration
        } else {
            false
        };

        if should_close || i == num_segments - 1 {
            if !current_segment_words.is_empty() {
                let seg_s = segment_start.unwrap_or(seg_start_s);
                let seg_e = current_segment_words
                    .last()
                    .map(|w| w.end)
                    .unwrap_or(seg_end_s);
                let text = current_segment_words
                    .iter()
                    .map(|w| w.word.as_str())
                    .collect::<Vec<_>>()
                    .join(" ");

                if !all_text.is_empty() {
                    all_text.push(' ');
                }
                all_text.push_str(&text);

                segments.push(Segment {
                    start: seg_s,
                    end: seg_e,
                    text,
                    words: current_segment_words.clone(),
                });

                current_segment_words.clear();
                segment_start = None;
            }
        }

        let progress = 15.0 + (i as f64 / num_segments as f64) * 65.0;
        let _ = app.emit(
            "transcription-progress",
            serde_json::json!({ "progress": progress, "status": format!("Processing segment {}/{}...", i + 1, num_segments) }),
        );
    }

    let detected_lang = if language == "auto" {
        "auto-detected".to_string()
    } else {
        language.to_string()
    };

    let _ = app.emit(
        "transcription-progress",
        serde_json::json!({ "progress": 95.0, "status": "Saving to history..." }),
    );

    let result = TranscriptionResult {
        id: uuid::Uuid::new_v4().to_string(),
        file_name: file_name.to_string(),
        file_path: file_path.to_string(),
        duration,
        segments,
        full_text: all_text,
        engine: "whisper".to_string(),
        model: model_name.to_string(),
        language: detected_lang,
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    let _ = app.emit(
        "transcription-progress",
        serde_json::json!({ "progress": 100.0, "status": "Done!" }),
    );

    Ok(result)
}

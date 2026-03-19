use crate::stt::whisper::Segment;

fn format_time_vtt(seconds: f64) -> String {
    let h = (seconds / 3600.0) as u32;
    let m = ((seconds % 3600.0) / 60.0) as u32;
    let s = (seconds % 60.0) as u32;
    let ms = ((seconds % 1.0) * 1000.0) as u32;
    format!("{:02}:{:02}:{:02}.{:03}", h, m, s, ms)
}

pub fn export(segments: &[Segment]) -> String {
    let mut output = String::from("WEBVTT\n\n");

    for (i, seg) in segments.iter().enumerate() {
        if i > 0 {
            output.push('\n');
        }
        output.push_str(&format!(
            "{} --> {}\n",
            format_time_vtt(seg.start),
            format_time_vtt(seg.end)
        ));
        output.push_str(&seg.text);
        output.push('\n');
    }

    output
}

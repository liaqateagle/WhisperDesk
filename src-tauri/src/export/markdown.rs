use crate::stt::whisper::Segment;

fn format_time(seconds: f64) -> String {
    let h = (seconds / 3600.0) as u32;
    let m = ((seconds % 3600.0) / 60.0) as u32;
    let s = (seconds % 60.0) as u32;
    if h > 0 {
        format!("{:02}:{:02}:{:02}", h, m, s)
    } else {
        format!("{:02}:{:02}", m, s)
    }
}

pub fn export(segments: &[Segment]) -> String {
    let mut output = String::from("# Transcript\n\n");

    for seg in segments {
        output.push_str(&format!("**[{}]**\n\n", format_time(seg.start)));
        output.push_str(&seg.text);
        output.push_str("\n\n");
    }

    output
}

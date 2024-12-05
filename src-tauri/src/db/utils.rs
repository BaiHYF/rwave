use id3::{Tag, TagLike};


/// Parses the tags from an MP3 file.
/// Returns the title, artist, and album name.
pub fn parse_mp3_tags(path: &str) -> Result<(Option<String>, Option<String>, Option<String>), Box<dyn std::error::Error>> {
    let tag = Tag::read_from_path(path)?;

    Ok((
        tag.title().map(|s| s.to_string()),
        tag.artist().map(|s| s.to_string()),
        tag.album().map(|s| s.to_string())
    ))
}
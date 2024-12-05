use id3::{Tag, TagLike};
use rodio::{Decoder, OutputStream, source::Source};
use std::io::BufReader;
use std::fs::File;

/// Parses the tags from an MP3 file.
/// Returns the title, artist, and album name.
pub fn parse_mp3_tags(
    path: &str,
) -> Result<(Option<String>, Option<String>, Option<String>, Option<u64>), Box<dyn std::error::Error>>
{
    let tag = Tag::read_from_path(path)?;
    let file = BufReader::new(File::open(path).unwrap());
    let source = Decoder::new(file).unwrap();


    Ok((
        tag.title().map(|s| s.to_string()),
        tag.artist().map(|s| s.to_string()),
        tag.album().map(|s| s.to_string()),
        source.total_duration().map(|d| d.as_secs()),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_mp3_tags() {
        let path = "F:/workspace/rwavetest/西木康智 - 洞窟ダンジョン.mp3";
        let (title, artist, album, duration) = parse_mp3_tags(path).unwrap();
        println!("Title: {:?}", title);
        println!("Artist: {:?}", artist);
        println!("Album: {:?}", album);
        println!("Duration: {:?}", duration);
    }
}
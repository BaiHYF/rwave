use crate::player::{Player, PlayerEvent};
use id3::{Tag, TagLike};
use rodio::{source::Source, Decoder};
use serde_derive::{Deserialize, Serialize};
use std::fs::File;
use std::io::BufReader;
use std::sync::Mutex;
use tauri::{ipc::Channel, State};

#[tauri::command]
pub fn load_track(player: State<'_, Mutex<Player>>, file_path: &str) {
    let player = player.lock().unwrap();
    player.load(file_path);
}

#[tauri::command]
pub fn play_track(player: State<'_, Mutex<Player>>) {
    // dbg!("command::play_track invoked.");
    player.lock().unwrap().play();
}

#[tauri::command]
pub fn pause_track(player: State<'_, Mutex<Player>>) {
    // dbg!("command::pause_track invoked.");
    player.lock().unwrap().pause();
}

#[tauri::command]
pub fn seek_track(player: State<Mutex<Player>>, position: u64) {
    player.lock().unwrap().seek(position);
    // unimplemented!("command::seek_module not implemented.")
}

#[tauri::command]
pub fn subscribe_player_event(
    player: State<'_, Mutex<Player>>,
    channel: Channel<PlayerEvent>,
) -> String {
    eprintln!("command::subscribe_player_event invoked.");
    dbg!(player.lock().unwrap().subscribe_event(channel))
}

#[tauri::command]
pub fn unsubscribe_player_event(player: State<'_, Mutex<Player>>, id: String) -> bool {
    eprintln!("command::unsubscribe_player_event invoked.");
    dbg!(player.lock().unwrap().unsubscribe_event(id))
}

#[tauri::command(rename_all = "snake_case")]
pub fn parse_mp3_tags_command(path: String) -> Tags {
    let tag = Tag::read_from_path(path.clone()).unwrap();
    let file = BufReader::new(File::open(path).unwrap());
    let source = Decoder::new(file).unwrap();

    let title = tag
        .title()
        .map(|s| s.to_string())
        .unwrap_or("UnknownTrack".into());
    let artist = tag
        .artist()
        .map(|s| s.to_string())
        .unwrap_or("UnknownArtist".into());
    let album = tag
        .album()
        .map(|s| s.to_string())
        .unwrap_or("UnknownAlbum".into());
    let duration = source.total_duration().map(|d| d.as_secs()).unwrap_or(0);

    Tags {
        title,
        artist,
        album,
        duration,
    }
}

#[derive(Serialize, Deserialize)]
pub struct Tags {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: u64,
}

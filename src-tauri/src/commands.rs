use std::sync::Mutex;
use tauri::{ipc::Channel, State};

use crate::player::{Player, PlayerEvent};

#[tauri::command]
pub fn load_track(player: State<'_, Mutex<Player>>, file_path: &str) {
    dbg!("command::load_track invoked.");
    let player = player.lock().unwrap();
    player.load(file_path);
}

#[tauri::command]
pub fn play_track(player: State<'_, Mutex<Player>>) {
    dbg!("command::play_track invoked.");
    player.lock().unwrap().play();
}

#[tauri::command]
pub fn pause_track(player: State<'_, Mutex<Player>>) {
    dbg!("command::pause_track invoked.");
    player.lock().unwrap().pause();
}

#[tauri::command]
pub fn subscribe_player_event(
    player: State<'_, Mutex<Player>>,
    channel: Channel<PlayerEvent>,
) -> String {
    dbg!("command::subscribe_player_event invoked.");
    player.lock().unwrap().subscribe_event(channel)
}

#[tauri::command]
pub fn unsubscribe_player_event(
    player: State<'_, Mutex<Player>>,
    id: String,
) -> bool {
    dbg!("command::unsubscribe_player_event invoked.");
    player.lock().unwrap().unsubscribe_event(id)
}

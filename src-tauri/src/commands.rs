use crate::player::{Player, PlayerEvent};
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

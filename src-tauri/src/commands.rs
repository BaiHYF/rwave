use std::sync::Mutex;
use tauri::State;

use crate::player::Player;

#[tauri::command]
pub fn load_track(player: State<'_, Mutex<Player>>, file_path: &str) {
    println!(
        "DEBUG: command::play_track invoked with argument:\n
            name = {}.",
        file_path
    );

    let player = player.lock().unwrap();
    player.load(file_path);
}

#[tauri::command]
pub fn play_track(player: State<'_, Mutex<Player>>) {
    println!("DEBUG: command::play_track invoked.");

    player.lock().unwrap().play();
}

#[tauri::command]
pub fn pause_track(player: State<'_, Mutex<Player>>) {
    println!("DEBUG: command::pause_track invoked.");

    player.lock().unwrap().pause();
}

/*
Usage of rodio,
Copied from https://github.com/RustAudio/rodio/blob/master/examples
```
use std::io::BufReader;

    let (_stream, handle) = rodio::OutputStream::try_default().unwrap();
    let sink = rodio::Sink::try_new(&handle).unwrap();

    let file = std::fs::File::open(file_path).unwrap();
    sink.append(rodio::Decoder::new(BufReader::new(file)).unwrap());

    sink.sleep_until_end(); // Block until the sound has finished playing.
```
*/

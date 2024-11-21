mod commands;
mod player;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let player = player::Player::spawn();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            app.manage(Mutex::new(player));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::load_track,
            commands::play_track,
            commands::pause_track,
            commands::subscribe_player_event,
            commands::unsubscribe_player_event,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

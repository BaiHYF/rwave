mod commands;
mod db;
mod player;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let player = player::Player::spawn();
    let migrations = crate::db::migrations::get_migrations();

    db::db_start();

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:rwave.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
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
            commands::seek_track,
            commands::subscribe_player_event,
            commands::unsubscribe_player_event,
            commands::parse_mp3_tags_command,
            db::playlistcommands::get_tracks_from_playlist,
            db::playlistcommands::create_playlist,
            db::playlistcommands::delete_playlist,
            db::playlistcommands::add_track_to_playlist,
            db::playlistcommands::remove_track_from_playlist,
            db::playlistcommands::rename_playlist,
            db::playlistcommands::get_all_playlists,
            db::playlistcommands::add_track_command,
            db::trackcommands::get_album,
            db::trackcommands::get_artist,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

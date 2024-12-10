use super::entities::Track;
use super::{constants::*, Playlist};
// use rusqlite::Error as RusqError;
use rusqlite::{params, Connection, Result};

#[tauri::command(rename_all = "snake_case")]
pub fn create_playlist(playlist_name: String) -> Result<(), String> {
    let conn = Connection::open(DB_URL).map_err(|e| e.to_string())?;

    let playlist_exists: Result<i32, _> = conn.query_row(
        "SELECT PlaylistID FROM Playlists WHERE Name = ?",
        params![&playlist_name],
        |row| row.get(0),
    );
    if playlist_exists.is_ok() {
        return Err("Playlist already exists".into());
    }

    conn.execute(
        "INSERT INTO Playlists (Name) VALUES (?)",
        params![&playlist_name],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn delete_playlist(playlist_id: i32) -> Result<(), String> {
    let conn = Connection::open(DB_URL).map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM Playlists WHERE PlaylistID = ?",
        params![playlist_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn add_track_to_playlist(playlist_id: i32, track_id: i32) -> Result<(), String> {
    let conn = Connection::open(DB_URL).map_err(|e| e.to_string())?;

    let playlist_exists: Result<i32, _> = conn.query_row(
        "SELECT PlaylistID FROM Playlists WHERE PlaylistID = ?",
        params![playlist_id],
        |row| row.get(0),
    );
    if playlist_exists.is_err() {
        return Err("Playlist not found".into());
    }

    let track_exists: Result<i32, _> = conn.query_row(
        "SELECT TrackID FROM Tracks WHERE TrackID = ?",
        params![track_id],
        |row| row.get(0),
    );
    if track_exists.is_err() {
        return Err("Track not found".into());
    }

    let track_in_playlist: Result<i32, _> = conn.query_row(
        "SELECT 1 FROM PlaylistTracks WHERE PlaylistID = ? AND TrackID = ?",
        params![playlist_id, track_id],
        |row| row.get(0),
    );
    if track_in_playlist.is_ok() {
        return Err("Track is already in the playlist".into());
    }

    conn.execute(
        "INSERT INTO TrackPlaylist (TrackID, PlaylistID) VALUES (?, ?)",
        params![track_id, playlist_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn remove_track_from_playlist(playlist_id: i32, track_id: i32) -> Result<(), String> {
    let conn = Connection::open(DB_URL).map_err(|e| e.to_string())?;

    let playlist_exists: Result<i32, _> = conn.query_row(
        "SELECT PlaylistID FROM Playlists WHERE PlaylistID = ?",
        params![playlist_id],
        |row| row.get(0),
    );
    if playlist_exists.is_err() {
        return Err("Playlist not found".into());
    }

    let track_exists: Result<i32, _> = conn.query_row(
        "SELECT TrackID FROM Tracks WHERE TrackID = ?",
        params![track_id],
        |row| row.get(0),
    );
    if track_exists.is_err() {
        return Err("Track not found".into());
    }

    conn.execute(
        "DELETE FROM TrackPlaylist WHERE PlaylistID = ? AND TrackID = ?",
        params![playlist_id, track_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_tracks_from_playlist(playlist_id: i32) -> Vec<Track> {
    let conn = Connection::open(DB_URL).unwrap();

    let mut tracks = Vec::new();

    let mut stmt = conn
        .prepare(
            "
            SELECT * FROM Tracks JOIN TrackPlaylist 
            ON Tracks.TrackID = TrackPlaylist.TrackID
            WHERE TrackPlaylist.PlaylistID = ? ",
        )
        .unwrap();

    let rows = stmt
        .query_map(params![playlist_id], |row| {
            Ok(Track {
                track_id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                artist_id: row.get(3)?,
                album_id: row.get(4)?,
                duration: row.get(5)?,
            })
        })
        .unwrap();

    for row in rows {
        tracks.push(row.unwrap());
    }

    tracks
}

#[tauri::command(rename_all = "snake_case")]
pub fn rename_playlist(playlist_id: i32, new_name: String) -> Result<(), String> {
    let conn = Connection::open(DB_URL).map_err(|e| e.to_string())?;

    let playlist_exists: Result<i32, _> = conn.query_row(
        "SELECT PlaylistID FROM Playlists WHERE PlaylistID = ?",
        params![playlist_id],
        |row| row.get(0),
    );
    if playlist_exists.is_err() {
        return Err("Playlist not found".into());
    }

    conn.execute(
        "UPDATE Playlists SET Name = ? WHERE PlaylistID = ?",
        params![new_name, playlist_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_all_playlists() -> Vec<Playlist> {
    let conn = Connection::open(DB_URL).unwrap();

    let mut all_playlists = Vec::new();

    let mut stmt = conn.prepare("SELECT * FROM Playlists").unwrap();

    let rows = stmt
        .query_map([], |row| {
            Ok(Playlist {
                playlist_id: row.get(0)?,
                name: row.get(1)?,
            })
        })
        .unwrap();

    for row in rows {
        all_playlists.push(row.unwrap());
    }

    all_playlists
}

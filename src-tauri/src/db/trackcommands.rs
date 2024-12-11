use super::entities::Track;
use super::{constants::*, Album, Artist, Playlist};
use rusqlite::{params, Connection, Result};

/// Get album by id
#[tauri::command(rename_all = "snake_case")]
pub fn get_album(album_id: i32) -> Album {
    let conn = Connection::open(DB_URL).unwrap();

    let mut stmt = conn.prepare("SELECT * FROM Albums WHERE AlbumID = ?").unwrap();
    let album_row = stmt.query_row(params![album_id], |row| {
        Ok(Album {
            album_id: row.get(0)?,
            name: row.get(1)?,
            artist_id: row.get(2)?,
        })
    });

    match album_row {
        Ok(album) => return album,
        Err(_) => return Album { album_id: None, name: "Unknown".to_string(), artist_id: None },
    }

}

/// Get album by id
#[tauri::command(rename_all = "snake_case")]
pub fn get_artist(artist_id: i32) -> Artist {
    let conn = Connection::open(DB_URL).unwrap();

    let mut stmt = conn.prepare("SELECT * FROM Artists WHERE ArtistID = ?").unwrap();
    let artist_row = stmt.query_row(params![artist_id], |row| {
        Ok(Artist{
            artist_id: row.get(0)?,
            name: row.get(1)?,
        })
    });

    match artist_row {
        Ok(artist) => return artist,
        Err(_) => return Artist{ artist_id: None, name: "Unknown Artist".to_string() },
    }

}
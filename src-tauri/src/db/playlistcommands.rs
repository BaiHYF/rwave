use super::entities::Track;
use super::{constants::*, Playlist};
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
pub fn get_all_playlists(db_url: String) -> Vec<Playlist> {
    let conn = Connection::open(&db_url).unwrap();
    
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

/// Receives a `.mp3` track path, parses the tags, and
/// adds its album and artist (if not already in the database) to database.
/// Then adds the track to the database, finally add the track to `All Tracks` playlist.
#[tauri::command(rename_all = "snake_case")]
pub fn add_track_command(track_path: String, db_url: String) -> String {
    let mut conn = Connection::open(&db_url).unwrap();

    // Parse the MP3 tags
    let (title, artist, album, duration) =
        crate::db::parse_mp3_tags(&track_path).unwrap_or((None, None, None, None));

    let track_name = match title {
        Some(t) => t,
        None => "Unknown Title".to_string(),
    };

    // if `track_name` exists in database, don't insert it
    let exist: Result<i32, _> = conn.query_row(
        "SELECT TrackID FROM Tracks WHERE Name = ?",
        params![&track_name],
        |row| row.get(0),
    );
    if exist.is_ok() {
        return "Track already exists".to_string();
    }

    let artist_name = match artist {
        Some(a) => a,
        None => "Unknown Artist".to_string(),
    };
    let album_name = match album {
        Some(a) => a,
        None => "Unknown Album".to_string(),
    };

    let track_duration = match duration {
        Some(d) => d,
        None => 0,
    };

    // Begin a transaction, for this series of operations
    let tx = conn.transaction().unwrap();

    // Search for the artist with name = `artist_name` in table `Artists`,
    // Get the `artist_id` if it exists,
    // Otherwise, insert a new artist item and return the new inserted item's `artist_id`
    let artist_id = tx
        .query_row(
            "SELECT ArtistID FROM Artists WHERE Name = ?",
            params![&artist_name],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| {
            tx.execute(
                "INSERT INTO Artists (Name) VALUES (?)",
                params![&artist_name],
            )
            .unwrap();
            tx.last_insert_rowid()
        });

    // Same solution for `album_id`
    let album_id = tx
        .query_row(
            "SELECT AlbumID FROM Albums WHERE Name = ? AND ArtistID = ?",
            params![&album_name, artist_id],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| {
            tx.execute(
                "INSERT INTO Albums (Name, ArtistID) VALUES (?, ?)",
                params![&album_name, artist_id],
            )
            .unwrap();
            tx.last_insert_rowid()
        });

    // Insert the track into the `Tracks` table
    match tx.execute(
        "INSERT INTO Tracks (Name, Path, ArtistID, AlbumID, Duration) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            &track_name,
            &track_path,
            artist_id,
            album_id,
            track_duration
        ],
    ) {
        Ok(_) => {
            let track_id = tx.last_insert_rowid();

            // Add the track to the playlist "All Tracks"
            tx.execute(
                "INSERT INTO TrackPlaylist (TrackID, PlaylistID) VALUES (?1, ?2)",
                params![track_id, 1],
            )
            .unwrap();

            tx.commit().unwrap();
            return "Track created".to_string();
        }
        Err(e) => {
            tx.rollback().unwrap();
            println!("Database error: {}", e);
            return "Invalid Operation".to_string();
        }
    }
}

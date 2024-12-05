use rusqlite::Error as RusqError;
use rusqlite::{params, Connection, Result};
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;

mod dbcommands;
mod constants;
mod entities;
mod utils;

use constants::*;
use entities::*;
use utils::*;

pub fn start() {
    println!("Starting databse: {}", DB_URL);

    //Set database
    if let Err(e) = set_database() {
        println!("Error: {}", e);
        return;
    }

    //start server and print port
    let listener = TcpListener::bind(format!("0.0.0.0:7744")).unwrap();
    println!("Server started at port 7744");

    //handle the client
    thread::spawn(move || {
        // Handle the client
        for stream in listener.incoming() {
            match stream {
                Ok(stream) => {
                    handle_client(stream);
                }
                Err(e) => {
                    println!("Error: {}", e);
                }
            }
        }
    });
}

//set_database function
fn set_database() -> Result<(), RusqError> {
    // Connect to database
    println!("Connecting to database {}...", DB_URL);
    let conn = Connection::open(DB_URL).unwrap();

    // Initialize database
    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS Artists (
            ArtistID INTEGER PRIMARY KEY,
            Name TEXT NOT NULL
        );",
        (),
    )?;

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS Albums (
            AlbumID INTEGER PRIMARY KEY,
            Name TEXT NOT NULL,
            ArtistID INTEGER NOT NULL,
            FOREIGN KEY(ArtistID) REFERENCES Artists(ArtistID)
        );",
        (),
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_Artists_ArtistID ON Artists(ArtistID);",
        (),
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_Albums_AlbumID ON Albums(AlbumID);",
        (),
    )?;

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS Tracks (
            TrackID INTEGER PRIMARY KEY,
            Name TEXT NOT NULL,
            Path TEXT NOT NULL,
            ArtistID INTEGER NOT NULL,
            AlbumID INTEGER NOT NULL,
            Duration INTEGER DEFAULT 0,
            FOREIGN KEY(ArtistID) REFERENCES Artists(ArtistID),
            FOREIGN KEY(AlbumID) REFERENCES Albums(AlbumID)
        );",
        (),
    )?;

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS Playlists (
            PlaylistID INTEGER PRIMARY KEY,
            Name TEXT NOT NULL
        );",
        (),
    )?;
    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS TrackPlaylist (
            TrackID INTEGER NOT NULL,
            PlaylistID INTEGER NOT NULL,
            PRIMARY KEY(TrackID, PlaylistID),
            FOREIGN KEY(TrackID) REFERENCES Tracks(TrackID),
            FOREIGN KEY(PlaylistID) REFERENCES Playlists(PlaylistID)
        );",
        (),
    )?;

    // Create a default playlist, which stores all the tracks
    conn.execute(
        "
        INSERT OR IGNORE INTO Playlists (Name) VALUES ('All Tracks');",
        (),
    )?;

    Ok(())
}

//handle_client function
fn handle_client(mut stream: TcpStream) {
    let mut buffer = [0; 1024];
    let mut request = String::new();

    match stream.read(&mut buffer) {
        Ok(size) => {
            request.push_str(String::from_utf8_lossy(&buffer[..size]).as_ref());
            // println!("{}", request);

            let (status_line, content) = match &*request {
                r if r.starts_with("POST /tracks") => handle_post_request(r),
                r if r.starts_with("GET /tracks/") => handle_get_request(r),
                r if r.starts_with("GET /tracks") => handle_get_all_request(r),
                r if r.starts_with("PUT /tracks/") => handle_put_request(r),
                r if r.starts_with("DELETE /tracks/") => handle_delete_request(r),
                r if r.starts_with("OPTIONS /") => (OK_RESPONSE.to_string(), "".to_string()), // Handle preflight request
                _ => (NOT_FOUND.to_string(), "404 Not Found".to_string()),
            };

            let response = status_line
                + ACCESS_CONTROL_ALLOW_ORIGIN
                + ACCESS_CONTROL_ALLOW_METHODS
                + ACCESS_CONTROL_ALLOW_HEADERS
                + ACCESS_CONTROL_ALLOW_CREDENTIALS
                + EMPTY_LINE
                + &content;

            stream.write_all(response.as_bytes()).unwrap();
        }
        Err(e) => {
            println!("Error: {}", e);
        }
    }
}

//handle_post_request function
fn handle_post_request(request: &str) -> (String, String) {
    match (get_user_request_body(&request), Connection::open(DB_URL)) {
        (Ok(track), Ok(mut conn)) => {
            // Parse the MP3 tags
            let (title, artist, album, duration) =
                parse_mp3_tags(&track.path).unwrap_or((None, None, None, None));

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
                return (OK_RESPONSE.to_string(), "Track already exists".to_string());
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
                params![&track_name, &track.path, artist_id, album_id, track_duration],
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
                    (OK_RESPONSE.to_string(), "Track created".to_string())
                },
                Err(e) => {
                    tx.rollback().unwrap();
                    println!("Database error: {}", e);
                    (
                        INTERNAL_SERVER_ERROR.to_string(),
                        "Invalid Operation".to_string(),
                    )
                }
            }
        }
        _ => (INTERNAL_SERVER_ERROR.to_string(), "Error".to_string()),
    }
}

//handle_get_request function
fn handle_get_request(request: &str) -> (String, String) {
    println!("{}", &request);
    match (get_id(&request).parse::<i32>(), Connection::open(DB_URL)) {
        (Ok(id), Ok(conn)) => {
            match conn.query_row(
                "SELECT * FROM Tracks WHERE TrackID = ?",
                params![id],
                |row| {
                    Ok(Track {
                        track_id: row.get(0)?,
                        name: row.get(1)?,
                        path: row.get(2)?,
                        artist_id: row.get(3)?,
                        album_id: row.get(4)?,
                        duration: row.get(5)?,
                    })
                },
            ) {
                Ok(track) => (
                    OK_RESPONSE.to_string(),
                    serde_json::to_string(&track).unwrap(),
                ),
                Err(_) => (NOT_FOUND.to_string(), "Track not found".to_string()),
            }
        }
        _ => (INTERNAL_SERVER_ERROR.to_string(), "Error".to_string()),
    }
}

//handle_get_all_request function
fn handle_get_all_request(_request: &str) -> (String, String) {
    match Connection::open(DB_URL) {
        Ok(conn) => {
            let mut tracks = Vec::new();

            let mut stmt = conn.prepare("SELECT * FROM Tracks").unwrap();
            let rows = stmt
                .query_map([], |row| {
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

            (
                OK_RESPONSE.to_string(),
                serde_json::to_string(&tracks).unwrap(),
            )
        }
        _ => (INTERNAL_SERVER_ERROR.to_string(), "Error".to_string()),
    }
}

//handle_put_request function
fn handle_put_request(request: &str) -> (String, String) {
    match (
        get_id(&request).parse::<i32>(),
        get_user_request_body(&request),
        Connection::open(DB_URL),
    ) {
        (Ok(id), Ok(track), Ok(conn)) => {
            conn.execute(
                "UPDATE Tracks SET Name = ?1, Path = ?2 WHERE TrackID = ?3",
                params![&track.name, &track.path, &id],
            )
            .unwrap();

            (OK_RESPONSE.to_string(), "Track updated".to_string())
        }
        _ => (INTERNAL_SERVER_ERROR.to_string(), "Error".to_string()),
    }
}

//handle_delete_request function
fn handle_delete_request(request: &str) -> (String, String) {
    match (get_id(&request).parse::<i32>(), Connection::open(DB_URL)) {
        (Ok(id), Ok(conn)) => {
            let rows_affected = conn
                .execute("DELETE FROM Tracks WHERE TrackID = $1", &[&id])
                .unwrap();

            if rows_affected == 0 {
                return (NOT_FOUND.to_string(), "Track not found".to_string());
            }

            (OK_RESPONSE.to_string(), "Track deleted".to_string())
        }
        _ => (INTERNAL_SERVER_ERROR.to_string(), "Error".to_string()),
    }
}

// get_id function
fn get_id(request: &str) -> &str {
    request
        .split("/")
        .nth(2)
        .unwrap_or_default()
        .split_whitespace()
        .next()
        .unwrap_or_default()
}

// deserialize user from request body with the id
fn get_user_request_body(request: &str) -> Result<Track, serde_json::Error> {
    serde_json::from_str(request.split("\r\n\r\n").last().unwrap_or_default())
}

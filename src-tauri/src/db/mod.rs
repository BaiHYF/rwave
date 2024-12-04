use rusqlite::Error as RusqError;
use rusqlite::{params, Connection, Result};
use serde_derive::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;

mod constants;

use constants::*;

// Model: Track struct with id, name, path
#[derive(Serialize, Deserialize)]
pub struct Track {
    pub track_id: Option<i32>,
    pub name: String,
    pub path: String,
}

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
    //Connect to database
    println!("Connecting to database {}...", DB_URL);
    let conn = Connection::open(DB_URL).unwrap();

    // Create table
    // conn.execute("DROP TABLE IF EXISTS tracks", ())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tracks (
            track_id   INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT NOT NULL
        )",
        (), // empty list of parameters.
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
        (Ok(track), Ok(conn)) => {
            println!(
                "INSERT INTO tracks (name, path) VALUES ({}, {})",
                &track.name, &track.path
            );

            match conn.execute(
                "INSERT INTO tracks (name, path) VALUES (?1, ?2)",
                (&track.name, &track.path),
            ) {
                Ok(_) => (OK_RESPONSE.to_string(), "Track created".to_string()),
                Err(e) => {
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
            match conn.query_row("SELECT * FROM tracks WHERE track_id = ?", params![id], |row| {
                Ok(Track {
                    track_id: row.get(0)?,
                    name: row.get(1)?,
                    path: row.get(2)?,
                })
            }) {
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

            let mut stmt = conn.prepare("SELECT * FROM tracks").unwrap();
            let rows = stmt
                .query_map([], |row| {
                    Ok(Track {
                        track_id: row.get(0)?,
                        name: row.get(1)?,
                        path: row.get(2)?,
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
                "UPDATE tracks SET name = ?1, path = ?2 WHERE track_id = ?3",
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
                .execute("DELETE FROM tracks WHERE track_id = $1", &[&id])
                .unwrap();

            if rows_affected == 0 {
                return (NOT_FOUND.to_string(), "Track not found".to_string());
            }

            (OK_RESPONSE.to_string(), "Track deleted".to_string())
        }
        _ => (INTERNAL_SERVER_ERROR.to_string(), "Error".to_string()),
    }
}

//get_id function
fn get_id(request: &str) -> &str {
    request
        .split("/")
        .nth(2)
        .unwrap_or_default()
        .split_whitespace()
        .next()
        .unwrap_or_default()
}

//deserialize user from request body with the id
fn get_user_request_body(request: &str) -> Result<Track, serde_json::Error> {
    serde_json::from_str(request.split("\r\n\r\n").last().unwrap_or_default())
}

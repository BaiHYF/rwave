use serde_derive::{Deserialize, Serialize};

/// Tracks
/// - TrackID (Primary Key)
/// - Name
/// - Path
/// - ArtistID (Foreign Key): Reference to the artist.
/// - AlbumID (Foreign Key): Reference to the album.
/// - Duration
#[derive(Serialize, Deserialize)]
pub struct Track {
    pub track_id: Option<i32>,
    pub name: String,
    pub path: String,
    pub artist_id: Option<i32>,
    pub album_id: Option<i32>,
    pub duration: Option<i32>,
}

/// Artists
/// - ArtistID (Primary Key)
/// - Name
pub struct Artist {
    pub artist_id: Option<i32>,
    pub name: String,
}

/// Albums
/// - AlbumID (Primary Key)
/// - Name
/// - ArtistID (Foreign Key): Reference to the artist.
pub struct Album {
    pub album_id: Option<i32>,
    pub name: String,
    pub artist_id: Option<i32>,
}

/// Playlists
/// - PlaylistID (Primary Key)
/// - Name
pub struct Playlist {
    pub playlist_id: Option<i32>,
    pub name: String,
}

use tauri_plugin_sql::{Migration, MigrationKind};
pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "Create Artists Table",
            sql: "
            CREATE TABLE IF NOT EXISTS Artists (
            ArtistID INTEGER PRIMARY KEY,
            Name TEXT NOT NULL
            );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "Create Album Table",
            sql: "
            CREATE TABLE IF NOT EXISTS Albums (
            AlbumID INTEGER PRIMARY KEY,
            Name TEXT NOT NULL,
            ArtistID INTEGER NOT NULL,
            FOREIGN KEY(ArtistID) REFERENCES Artists(ArtistID)
            );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "Create ArtistID Index",
            sql: "CREATE INDEX IF NOT EXISTS idx_Artists_ArtistID ON Artists(ArtistID);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "Create AlbumID Index",
            sql: "CREATE INDEX IF NOT EXISTS idx_Albums_AlbumID ON Albums(AlbumID);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "Create Tracks Table",
            sql: "
            CREATE TABLE IF NOT EXISTS Tracks (
            TrackID INTEGER PRIMARY KEY,
            Name TEXT NOT NULL,
            Path TEXT NOT NULL,
            ArtistID INTEGER NOT NULL,
            AlbumID INTEGER NOT NULL,
            Duration INTEGER DEFAULT 0,
            FOREIGN KEY(ArtistID) REFERENCES Artists(ArtistID),
            FOREIGN KEY(AlbumID) REFERENCES Albums(AlbumID)
            );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "Create Playlists Table",
            sql: "
            CREATE TABLE IF NOT EXISTS Playlists (
            PlaylistID INTEGER PRIMARY KEY,
            Name TEXT NOT NULL
            );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "Create TrackPlaylist Relationship Table",
            sql: "
            CREATE TABLE IF NOT EXISTS TrackPlaylist (
            TrackID INTEGER NOT NULL,
            PlaylistID INTEGER NOT NULL,
            PRIMARY KEY(TrackID, PlaylistID),
            FOREIGN KEY(TrackID) REFERENCES Tracks(TrackID),
            FOREIGN KEY(PlaylistID) REFERENCES Playlists(PlaylistID)
            );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "Insert a default playlist `All Tracks`, which would store all tracks",
            sql: "INSERT OR IGNORE INTO Playlists (PlaylistID, Name) VALUES (1, 'All Tracks');",
            kind: MigrationKind::Up,
        },
    ]
}

"use client";

import Database from "@tauri-apps/plugin-sql";
import { Playlist } from "../context/playlistcontext";
import { Track, Album, Artist } from "../context/trackcontext";
import { invoke, Channel } from "@tauri-apps/api/core";

const dbURL = "sqlite:rwave.db";

interface Tags {
  title: string;
  artist: string;
  album: string;
  duration: number;
}

interface DBinfo {
  seq: number;
  name: string;
  file: string;
}

// Or do it with migration
export const init_database = async () => {
  const db = await Database.load(dbURL);

  await db.execute(
    `
      CREATE TABLE IF NOT EXISTS Artists (
        ArtistID INTEGER PRIMARY KEY,
        Name TEXT NOT NULL
      )
    `,
    []
  );
  await db.execute(
    `
      CREATE TABLE IF NOT EXISTS Albums (
          AlbumID INTEGER PRIMARY KEY,
          Name TEXT NOT NULL,
          ArtistID INTEGER NOT NULL,
          FOREIGN KEY(ArtistID) REFERENCES Artists(ArtistID)
      );
    `,
    []
  );
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_Artists_ArtistID ON Artists(ArtistID);",
    []
  );
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_Albums_AlbumID ON Albums(AlbumID);",
    []
  );
  await db.execute(
    `
      CREATE TABLE IF NOT EXISTS Tracks (
          TrackID INTEGER PRIMARY KEY,
          Name TEXT NOT NULL,
          Path TEXT NOT NULL,
          ArtistID INTEGER NOT NULL,
          AlbumID INTEGER NOT NULL,
          Duration INTEGER DEFAULT 0,
          FOREIGN KEY(ArtistID) REFERENCES Artists(ArtistID),
          FOREIGN KEY(AlbumID) REFERENCES Albums(AlbumID)
    `,
    []
  );
  await db.execute(
    `
      CREATE TABLE IF NOT EXISTS Playlists (
                  PlaylistID INTEGER PRIMARY KEY,
                  Name TEXT NOT NULL
              );
    `,
    []
  );
  await db.execute(
    `
      CREATE TABLE IF NOT EXISTS TrackPlaylist (
                  TrackID INTEGER NOT NULL,
                  PlaylistID INTEGER NOT NULL,
                  PRIMARY KEY(TrackID, PlaylistID),
                  FOREIGN KEY(TrackID) REFERENCES Tracks(TrackID),
                  FOREIGN KEY(PlaylistID) REFERENCES Playlists(PlaylistID)
              );
    `,
    []
  );
  await db.execute(
    `
      INSERT OR IGNORE INTO Playlists (PlaylistID, Name) VALUES (1, 'All Tracks');
    `,
    []
  );
};
export const fetchAllTracksFromPlaylist = async (pl: Playlist) => {
  const db = await Database.load(dbURL);
  const tracks = (await db.select(
    "SELECT * FROM Tracks JOIN TrackPlaylist \
    ON Tracks.TrackID = TrackPlaylist.TrackID \
    WHERE TrackPlaylist.PlaylistID = $1",
    [pl.playlist_id]
  )) as Array<Track>;
  return tracks as Track[];
};

export const getDatabasePath = async () => {
  const db = await Database.load(dbURL);
  const res = (await db.select("PRAGMA database_list", [])) as Array<DBinfo>;
  // console.log(res);
  // console.log("DATABASE PATH: ", res[0].file);
  return res[0].file;
};

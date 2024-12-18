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
  return res[0].file;
};

export const addTrackToPlaylist = async (track: Track, playlist: Playlist) => {
  const db = await Database.load(dbURL);
  // "INSERT OR IGNORE INTO TrackPlaylist (TrackID, PlaylistID) VALUES (?1, ?2)"
  await db.execute(
    "INSERT OR IGNORE INTO TrackPlaylist (TrackID, PlaylistID) VALUES ($1, $2)",
    [track.TrackID, playlist.playlist_id]
  );
  console.log("DEBUG: Added " + track.Name + " to playlist" + playlist.name);
};

export const createNewPlaylist = async (name: string) => {
  const db = await Database.load(dbURL);
  await db.execute("INSERT INTO Playlists (Name) VALUES ($1)", [name]);
};

export const deletePlaylist = async (id: number) => {
  const db = await Database.load(dbURL);
  await db.execute("DELETE FROM TrackPlaylist WHERE PlaylistID = $1", [id]);
  await db.execute("DELETE FROM Playlists WHERE PlaylistID = $1", [id]);
};

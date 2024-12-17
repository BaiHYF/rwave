"use client";

import Database from "@tauri-apps/plugin-sql";
import { Playlist } from "../context/playlistcontext";
import { Track, Album, Artist } from "../context/trackcontext";

const dbURL = "sqlite:rwave.db";

export const fetchAllTracksFromPlaylist = async (pl: Playlist) => {
  const db = await Database.load(dbURL);
  const tracks = (await db.select(
    "SELECT * FROM Tracks JOIN TrackPlaylist \
    ON Tracks.TrackID = TrackPlaylist.TrackID \
    WHERE TrackPlaylist.PlaylistID = $1",
    [pl.playlist_id]
  )) as Array<Track>;
  //   console.log(tracks);
  //   console.log("Length: ", tracks.length);
  return tracks as Track[];
};

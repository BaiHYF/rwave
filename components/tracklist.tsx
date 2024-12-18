import React, { useState, useEffect } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import { useTrack, Track } from "@/components/context/trackcontext";
import { usePlaylist, Playlist } from "./context/playlistcontext";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePlayStateContext } from "./context/playstatecontext";
import { fetchAllTracksFromPlaylist, getDatabasePath } from "./utils/db-util";

const ScrollTrackList = () => {
  const { currentTrack, setCurrentTrack, tracks, setTracks } = useTrack();
  const { playlist, setPlaylist, playlists, setPlaylists } = usePlaylist();
  const { playState, setPlayState } = usePlayStateContext();

  useEffect(() => {
    const fetchAllPlaylist = async () => {
      const dbURL = await getDatabasePath();
      console.log("ScrollTrackList: Fetching all playlists from ", dbURL);
      try {
        invoke("get_all_playlists", { db_url: dbURL }).then((data) => {
          const playlistsData = data as Playlist[];
          console.log(playlistsData);
          setPlaylists(playlistsData);
        });
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchAllPlaylist();
  }, []);

  useEffect(() => {
    if (playlists.length > 0) {
      setPlaylist(playlists[0]);
    }
  }, [playlists]);

  useEffect(() => {
    if (playlist !== null) {
      const trks = fetchAllTracksFromPlaylist(playlist);
      trks.then((data) => {
        const tracksData = data as Track[];
        setTracks(tracksData);
        console.log("Track data: ", tracksData);
        console.log("Tracks : ", tracks);
      });
    }
  }, [playlist]);

  const handleButtonClick = async (track: Track) => {
    setCurrentTrack(track);
    const filepath = track.Path;
    if (filepath !== null) {
      await invoke("load_track", { filePath: filepath });
      setPlayState(true);
    }
  };

  return (
    <div>
      <ScrollArea
        className="w-[200px] h-[200px] "
        // style={{ overflow: "hidden" }}
      >
        {tracks.length === 0 ? (
          <p>No tracks available.</p>
        ) : (
          <div>
            <span className="pt-2 font-semibold font-mono text-muted-foreground italic">
              {playlist?.name}
            </span>
            {tracks.map((track) => (
              <figure key={track.TrackID}>
                <div className="overflow-hidden">
                  <Button
                    onClick={() => handleButtonClick(track)}
                    variant="link"
                    className={`font-sans
                       ${
                         track === currentTrack ? "font-bold" : "text-zinc-500"
                       }`}
                  >
                    {track.Name}
                  </Button>
                </div>
              </figure>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ScrollTrackList;

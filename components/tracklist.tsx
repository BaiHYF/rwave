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
  const {
    playlist,
    setPlaylist,
    playlists,
    setPlaylists,
    tracklistExecOnce,
    setTracklistExecOnce,
  } = usePlaylist();
  const { playState, setPlayState } = usePlayStateContext();

  const fetchAllPlaylist = async () => {
    const dbURL = await getDatabasePath();
    // console.log("ScrollTrackList: Fetching all playlists from ", dbURL);
    try {
      await invoke("get_all_playlists", { db_url: dbURL }).then((data) => {
        const playlistsData = data as Playlist[];
        setPlaylists(playlistsData);
        // console.log("DEBUG in fetchAllPlaylist PlaylistsData: ", playlistsData); // 这里输出 Array(2)
        // console.log("DEBUG in fetchAllPlaylist Playlists: ", playlists); // 这里输出 Array(0)，没能成功赋值 playlists， 为什么?
      });
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  useEffect(() => {
    const initScrollTrackList = async () => {
      await fetchAllPlaylist(); // wait for playlists to be fetched
    };
    initScrollTrackList();
  }, []);

  // make sure `setPlaylist(playlists[0])` below executes only once when the app is mounted
  // const [execOnce, setExecOnce] = useState(true);
  useEffect(() => {
    // console.log("DEBUG: tracklist.tsx.40 execOnce: ", tracklistExecOnce);
    if (playlists.length > 0 && tracklistExecOnce) {
      setPlaylist(playlists[0]);
      setTracklistExecOnce(false);
    }
  }, [playlists]);

  useEffect(() => {
    console.log("DEBUG: tracklist.tsx.57 playlist: ", playlist);
    if (playlist !== null) {
      const trks = fetchAllTracksFromPlaylist(playlist);
      trks.then((data) => {
        const tracksData = data as Track[];
        setTracks(tracksData);
        // console.log("Track data: ", tracksData);
        console.log(
          "Tracklist.tsx: 61 -- number of tracks in scroll playlist -> ",
          tracks.length
        );
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
          <p>Empty playlist~ 😶‍🌫️.</p>
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

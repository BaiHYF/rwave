import React, { useState, useEffect } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "@/components/ui/select";
import { useTrack, Track } from "@/components/context/trackcontext";
import { usePlaylist, Playlist } from "../context/playlistcontext";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePlayStateContext } from "../context/playstatecontext";

export const db_url =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:7744";

const ScrollTrackList = () => {
  const { currentTrack, setCurrentTrack, tracks, setTracks } = useTrack();
  const { playlist, setPlaylist, playlists, setPlaylists } = usePlaylist();
  const [selectedTrackName, setSelectedTrackName] = useState<string>("");
  const { playState, setPlayState } = usePlayStateContext();

  useEffect(() => {
    const fetchAllPlaylist = async () => {
      try {
        invoke("get_all_playlists").then((data) => {
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
    const fetchAllTracksFromPlaylist = async () => {
      try {
        if (playlist !== null) {
          invoke("get_tracks_from_playlist", {
            playlist_id: playlist.playlist_id,
          }).then((data) => {
            const tracksData = data as Track[];
            setTracks(tracksData);
          });
        }
        console.log(playlist);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchAllTracksFromPlaylist();
  }, [playlist]);

  const handleButtonClick = async (track: Track) => {
    setCurrentTrack(track);
    const filepath = track.path;
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
              <figure key={track.track_id}>
                <div className="overflow-hidden">
                  <Button
                    onClick={() => handleButtonClick(track)}
                    variant="link"
                    className={`font-sans
                       ${
                         track === currentTrack ? "font-bold" : "text-zinc-500"
                       }`}
                  >
                    {track.name}
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

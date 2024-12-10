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

export const db_url =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:7744";

const TrackList = () => {
  const { currentTrack, setCurrentTrack, tracks, setTracks } = useTrack();
  const { playlist, setPlaylist, playlists, setPlaylists } = usePlaylist();
  const [selectedTrackName, setSelectedTrackName] = useState<string>("");

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

  const handleSelectChange = async (value: string) => {
    const selectedTrack = tracks.find((track) => track.name === value);
    if (selectedTrack) {
      setCurrentTrack(selectedTrack);
      const filepath = selectedTrack.path;
      if (filepath !== null) {
        await invoke("load_track", { filePath: filepath });
      }
    }
  };

  return (
    <div>
      {tracks.length === 0 ? (
        <p>No tracks available.</p>
      ) : (
        <Select onValueChange={handleSelectChange} value={selectedTrackName}>
          <SelectTrigger className="w-[280px]">
            <SelectValue
              placeholder={currentTrack ? currentTrack.name : "Select a track"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton />
            <SelectGroup key="group">
              <SelectLabel>Default Playlist</SelectLabel>
              {tracks.map((track) => (
                <SelectItem key={track.track_id} value={track.name}>
                  {track.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default TrackList;

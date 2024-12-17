import { invoke, Channel } from "@tauri-apps/api/core";
import { useTrack, Track } from "@/components/context/trackcontext";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Marquee } from "@/components/ui/marquee";
import { Playlist, usePlaylist } from "./context/playlistcontext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { usePlayerControls } from "@/components/hooks/usePlayerControls";
import { Brush, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React, { useCallback, useState } from "react";
import CreatePlaylistForm from "./create-playlist-form";

type PlaylistPageBodyProps = {
  currentTrack: Track | null;
  albumName: string;
  artistName: string;
  position: number;
  duration: number;
  isSeeking: boolean;
  setPosition: (position: number) => void;
  setIsSeeking: (isSeeking: boolean) => void;
};

const PlaylistPageBody = ({
  currentTrack,
  albumName,
  artistName,
  position,
  duration,
  setPosition,
  setIsSeeking,
}: PlaylistPageBodyProps) => {
  const { playlist, setPlaylist, playlists, setPlaylists } = usePlaylist();
  const { handleLoadDir, handleLoadFile } = usePlayerControls();

  return (
    <div className="space-y-2 mb-4 w-[450px] flex flex-col">
      <div className="flex flex-row justify-between">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Add track</Button>
          </PopoverTrigger>
          <PopoverContent>
            <Button variant="link" onClick={handleLoadFile}>
              Select a single file
            </Button>
            <Button variant="link" onClick={handleLoadDir}>
              Select a directory
            </Button>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Create New Playlist</Button>
          </PopoverTrigger>
          <PopoverContent>
            <CreatePlaylistForm />
          </PopoverContent>
        </Popover>
      </div>

      {playlists.map((pl) => (
        <PlaylistItem key={pl.playlist_id} playlist={pl} />
      ))}
    </div>
  );
};

type PlaylistItemProps = {
  playlist: Playlist;
};

const PlaylistItem = ({ playlist }: PlaylistItemProps) => {
  return (
    <div className="flex flex-row items-center justify-center">
      <div className="flex space-x-2">
        <Button variant="link">{playlist.name}</Button>
        <Button variant="ghost">Add Track</Button>
        <Button variant="ghost">Delete Track</Button>
        {playlist.playlist_id !== 1 && (
          <Button variant="ghost">Delete Playlist</Button>
        )}
      </div>
    </div>
  );
};

export default PlaylistPageBody;

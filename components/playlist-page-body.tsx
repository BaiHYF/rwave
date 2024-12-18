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
import React, { useCallback, useState } from "react";
import CreatePlaylistForm from "./create-playlist-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect } from "react";
import { fetchAllTracksFromPlaylist } from "@/components/utils/db-util";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

type PlaylistPageBodyProps = {};

const PlaylistPageBody = ({}: PlaylistPageBodyProps) => {
  const { playlist, setPlaylist, playlists, setPlaylists } = usePlaylist();
  const { handleLoadDir, handleLoadFile } = usePlayerControls();

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [allTracks, setAllTracks] = useState<Track[]>([]);

  useEffect(() => {
    const allTracksPl: Playlist = {
      playlist_id: 1,
      name: "All Tracks",
    };
    fetchAllTracksFromPlaylist(allTracksPl).then((atks) => {
      setAllTracks(atks);
    });
  }, []);

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

      {playlists.map(
        (pl) =>
          pl.playlist_id !== 0 && (
            <div
              className="flex flex-row items-center justify-center"
              key={pl.playlist_id}
            >
              <div className="flex space-x-2">
                <Button variant="link">{pl.name}</Button>
                {/* <Button variant="ghost">Add Track</Button> */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost">Add Track</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add to {pl.name}</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                      <ScrollArea className="w-[400px] h-[100px] ">
                        {allTracks.length === 0 ? (
                          <p>No tracks available.</p>
                        ) : (
                          <div>
                            {allTracks.map((track) => (
                              <figure key={track.TrackID}>
                                <div className="overflow-hidden">
                                  <Button
                                    variant="link"
                                    className={`font-sans 
                       ${
                         track === selectedTrack ? "font-bold" : "text-zinc-500"
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

                      {/* <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a track" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea>
                            {allTracks.map((track) => (
                              <SelectItem
                                key={track.TrackID}
                                value={track.Name}
                              >
                                {track.Name}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select> */}
                    </DialogDescription>
                    <DialogFooter>
                      <Button variant="ghost" type="submit">
                        submit
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost">Delete Track</Button>
                <Button variant="ghost">Delete Playlist</Button>
              </div>
            </div>
          )
      )}
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
        <Button variant="ghost">Delete Playlist</Button>
      </div>
    </div>
  );
};

export default PlaylistPageBody;

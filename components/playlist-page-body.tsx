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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect } from "react";
import {
  getDatabasePath,
  fetchAllTracksFromPlaylist,
  addTrackToPlaylist,
  deletePlaylist,
  createNewPlaylist,
} from "@/components/utils/db-util";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { set } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
type PlaylistPageBodyProps = {};

const formSchema = z.object({
  playlistName: z
    .string()
    .min(4, {
      message: "Playlist name must be at least 4 characters.",
    })
    .max(30, {
      message: "Playlist name must be at most 30 characters.",
    }),
});

const PlaylistPageBody = ({}: PlaylistPageBodyProps) => {
  const { playlist, setPlaylist, playlists, setPlaylists } = usePlaylist();
  const { handleLoadDir, handleLoadFile } = usePlayerControls();

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [allTracks, setAllTracks] = useState<Track[]>([]);

  const [trigger, setTrigger] = useState(false);

  const msg0: string = `no track available, please load some tracks to rwave first...`;

  const [display, setDisplay] = useState(false);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playlistName: "",
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    createNewPlaylist(values.playlistName);
    setDisplay(true);
    setTrigger(!trigger);
  }

  const fetchAllPlaylist = async () => {
    const dbURL = await getDatabasePath();
    // console.log("Playlistpage: Fetching all playlists from ", dbURL);
    try {
      invoke("get_all_playlists", { db_url: dbURL }).then((data) => {
        const playlistsData = data as Playlist[];
        // console.log(playlistsData);
        setPlaylists(playlistsData);
      });
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  useEffect(() => {
    const allTracksPl: Playlist = {
      playlist_id: 1,
      name: "All Tracks",
    };

    fetchAllPlaylist();

    fetchAllTracksFromPlaylist(allTracksPl).then((atks) => {
      setAllTracks(atks);
    });
  }, [trigger]);

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
            {/* <CreatePlaylistForm /> */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="playlistName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a cool name here"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Create a new playlist with a name, not necessarily
                        unique but recommended.
                      </FormDescription>
                      <div className={`${display ? "block" : "hidden"}`}>
                        <FormDescription className="text-green-500">
                          Playlist created successfully 😄
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Submit</Button>
              </form>
            </Form>
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
                <Button
                  variant="link"
                  onClick={() => {
                    setPlaylist(pl);
                  }}
                >
                  {pl.name}
                </Button>
                {/* <Button variant="ghost">Add Track</Button> */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost">Add Track</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {allTracks.length === 0
                          ? msg0
                          : "Add track to '" + pl.name + "'"}
                      </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription asChild>
                      <div>
                        <ScrollArea className="w-[400px] h-[100px] ">
                          <div>
                            {allTracks.map((track) => (
                              <div
                                className="overflow-hidden"
                                key={track.TrackID}
                              >
                                <Button
                                  variant="link"
                                  onClick={() => {
                                    setSelectedTrack(track);
                                  }}
                                  className={`font-sans 
                       ${
                         track === selectedTrack ? "font-bold" : "text-zinc-500"
                       }`}
                                >
                                  {track.Name}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (selectedTrack) {
                            addTrackToPlaylist(selectedTrack, pl);
                            setTrigger(!trigger);
                            setPlaylist(pl);
                          }
                        }}
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="ghost">Delete Track</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost">Delete Playlist</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete playlist {pl.name}, are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the playlist and remove your data from rwave's
                        database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          deletePlaylist(pl.playlist_id).then(() => {
                            setTrigger(!trigger);
                            setPlaylist(playlists[0]);
                          });
                        }}
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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

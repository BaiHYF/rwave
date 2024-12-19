import { invoke } from "@tauri-apps/api/core";
import { Track } from "@/components/context/trackcontext";
import { Playlist, usePlaylist } from "./context/playlistcontext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { usePlayerControls } from "@/components/hooks/usePlayerControls";
import React, { useState } from "react";
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
import { useEffect, useCallback } from "react";
import {
  getDatabasePath,
  fetchAllTracksFromPlaylist,
  addTrackToPlaylist,
  deletePlaylist,
  deleteTrackFromPlaylist,
  createNewPlaylist,
} from "@/components/utils/db-util";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ListMusic, Upload, ListPlus, ListX, Trash2 } from "lucide-react";

type PlaylistPageBodyProps = {
  TrackListRefreshTrigger: boolean;
  setTrackListRefreshTrigger: React.Dispatch<React.SetStateAction<boolean>>;
};

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

const PlaylistPageBody = ({
  setTrackListRefreshTrigger,
}: PlaylistPageBodyProps) => {
  const { setPlaylist, playlists, setPlaylists } = usePlaylist();
  const { handleLoadDir, handleLoadFile } = usePlayerControls();
  // const { tracks, setTracks } = useTrack();

  // selected track : 歌单中添加/删除歌曲用户鼠标选中的歌曲
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  // all tracks: 从数据库中获取所有歌曲,用于歌单在添加歌曲界面中渲染供用户选择
  const [allTracks, setAllTracks] = useState<Track[]>([]);

  // trigger: add track 刷新歌单列表
  const [trigger, setTrigger] = useState(false);

  // msg0: rwave数据库中没有歌曲时显示
  const msg0: string = `no track available, please load some tracks to rwave first...`;

  // display: 设置是否显示创建歌单成功的信息
  const [display, setDisplay] = useState(false);

  // TrkPlMap: 哈希表，key:number -- playlistID, value: Track[] -- 该歌单中所有歌曲
  const [TrkPlMap, setTrkPlMap] = useState<Map<number, Track[]>>(new Map());

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
    setTrigger((t) => !t);
    setTrackListRefreshTrigger((t) => !t);
  }

  // const fetchAllPlaylist = async () => {
  //   const dbURL = await getDatabasePath();
  //   // console.log("Playlistpage: Fetching all playlists from ", dbURL);
  //   try {
  //     invoke("get_all_playlists", { db_url: dbURL }).then((data) => {
  //       const playlistsData = data as Playlist[];
  //       // console.log(playlistsData);
  //       setPlaylists(playlistsData);
  //     });
  //   } catch (error) {
  //     console.error("Error fetching data: ", error);
  //   }
  // };

  const fetchAllPlaylist = useCallback(async () => {
    const dbURL = await getDatabasePath();
    try {
      const data = await invoke("get_all_playlists", { db_url: dbURL });
      const playlistsData = data as Playlist[];
      setPlaylists(playlistsData);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  }, [setPlaylists]);

  useEffect(() => {
    fetchAllPlaylist();
  }, [fetchAllPlaylist]);

  useEffect(() => {
    const allTracksPl: Playlist = {
      playlist_id: 1,
      name: "All Tracks",
    };

    fetchAllPlaylist();
    fetchAllTracksFromPlaylist(allTracksPl).then((atks) => {
      setAllTracks(atks);
    });

    const tmpMap = new Map();
    playlists.forEach((pl) => {
      fetchAllTracksFromPlaylist(pl).then((trks) => {
        tmpMap.set(pl.playlist_id, trks);
      });
    });
    setTrkPlMap(tmpMap);
    // console.log("DEBUG: USEEFFECT -- TrkPlMap: ", TrkPlMap);
  }, [trigger, fetchAllPlaylist, playlists]);

  return (
    <div className="space-y-2 mb-4 w-[450px] flex flex-col">
      <div className="flex flex-row justify-start">
        {/* Button `Add track` at the top */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Upload />
              Load track
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Button variant="link" onClick={handleLoadFile}>
              Load a file
            </Button>
            <Button variant="link" onClick={handleLoadDir}>
              Load a directory
            </Button>
          </PopoverContent>
        </Popover>

        {/* Button `Create New Playlist` at the top */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <ListMusic />
              Create New Playlist
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            {/* Form `Create Playlist` <CreatePlaylistForm /> */}
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
      {/* Scroll Area to display all playlists */}
      <div className="text-zinc-500">
        {playlists.length === 1
          ? `create your first playlist by clicking the 'Create New Playlist' button above...`
          : ``}
      </div>
      <div className="text-zinc-500">
        {playlists.length === 1
          ? `use the 'Load track' button above to add some local .mp3 files to the APP...`
          : ``}
      </div>
      <ScrollArea className="h-[150px]">
        {playlists.map(
          (pl) =>
            pl.playlist_id !== 1 && (
              <div
                className="flex flex-row items-center justify-between overflow-hidden"
                key={pl.playlist_id}
              >
                <div className="flex space-x-1">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button
                        className="flex-none w-[60px] justify-start overflow-hidden"
                        variant="link"
                        onClick={() => {
                          setPlaylist(pl);
                        }}
                      >
                        {/* <Marquee className="w-[150px]">{pl.name}</Marquee> */}
                        {pl.name}
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="flex justify-start">
                      <Button variant="link" className="justify-start">
                        <ListMusic />
                        {pl.name}
                      </Button>
                    </HoverCardContent>
                  </HoverCard>
                  {/* Button `Add Track` */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost">
                        <ListPlus />
                        Add Track
                      </Button>
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
                            }
                            setPlaylist(pl);
                            setTrigger((t) => !t);
                            setTrackListRefreshTrigger((t) => !t);
                          }}
                        >
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {/* Dialog `Delete Track` (from a playlist) */}
                  {/* <Button variant="ghost">Delete Track</Button> */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost">
                        <ListX />
                        {`Delete Track`}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {/* 获取当前 playlist 内所有的 tracks, 在 AlertDialogDescription
                          中的 ScrollArea 中为每个 track 创建一个 Button 
                          
                          也许我应该把 Add track 与 Delete track 坐在同一个界面？
                          */}
                          Remove track from '{pl.name}'
                        </AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogDescription asChild>
                        <div>
                          <ScrollArea className="w-[400px] h-[100px]">
                            <div className="flex flex-col">
                              {TrkPlMap.get(pl.playlist_id)?.map((track) => (
                                <Button
                                  key={track.TrackID}
                                  variant="link"
                                  onClick={() => {
                                    setSelectedTrack(track);
                                  }}
                                  className={`font-sans justify-between
                                  ${
                                    track === selectedTrack
                                      ? "font-bold"
                                      : "text-zinc-500"
                                  }`}
                                >
                                  {track.Name}
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setPlaylist(pl);
                            if (selectedTrack) {
                              deleteTrackFromPlaylist(
                                selectedTrack.TrackID,
                                pl.playlist_id
                              );
                            }
                            setTrigger((t) => !t);
                            setTrackListRefreshTrigger((t) => !t);
                            setPlaylist(pl);
                          }}
                        >
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {/* Button `Delete Playlist` */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost">
                        <Trash2 />
                        Delete Playlist
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete playlist {pl.name}, are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {`This action cannot be undone. This will permanently
                          delete the playlist and remove your data from rwave's
                          database.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            deletePlaylist(pl.playlist_id).then(() => {
                              setTrigger((t) => !t);
                              setTrackListRefreshTrigger((t) => !t);
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
      </ScrollArea>
    </div>
  );
};

export default PlaylistPageBody;

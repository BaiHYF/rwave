"use client";
import { Button } from "@/components/ui/button";
import {
  Folder,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir, BaseDirectory } from "@tauri-apps/plugin-fs";
import { Slider } from "@/components/ui/slider";
import ScrollTrackList from "@/components/ui/tracklist";
import { db_url } from "@/components/ui/tracklist";
import axios from "axios";
import { useTrack, Track, Album } from "@/components/context/trackcontext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Separator } from "@/components/ui/separator";
import { The_Cyclops_in_Love } from "./placeholder";
import { AppSidebar } from "@/components/app-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { Track } from "@radix-ui/react-slider";
import { usePlayStateContext } from "@/components/context/playstatecontext";
import { Marquee } from "@/components/ui/marquee";

type PlayerEvent =
  | { event: "playing" }
  | { event: "paused" }
  | {
      event: "positionUpdate";
      data: {
        position: number;
        duration: number;
      };
    };

export default function Home() {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const { currentTrack, setCurrentTrack, tracks, setTracks } = useTrack();
  const { playState, setPlayState } = usePlayStateContext();
  const [albumName, setAlbumName] = useState("Unknown Album");

  // window size
  const width: string = "950px";
  const height: string = "500px";

  useEffect(() => {
    const channel = new Channel<PlayerEvent>();

    channel.onmessage = (message) => {
      switch (message.event) {
        case "positionUpdate":
          console.log(message.data);
          setPosition(message.data.position);
          setDuration(message.data.duration);
          break;
        default:
          console.log(message.event);
      }
    };

    const subscriptionPromise = invoke("subscribe_player_event", {
      channel: channel,
    });

    return () => {
      subscriptionPromise.then((id) =>
        invoke("unsubscribe_player_event", { id: id })
      );
    };
  }, []);

  const handleLoad = useCallback(async () => {
    const filepath = await open({
      multiple: false,
      directory: true,
    });

    // 遍历文件夹下每一个 .mp3 文件，解析为 Track 对象，并发送 HTTP 请求，添加到数据库中
    if (filepath !== null) {
      const entries = await readDir(filepath as string, {
        baseDir: BaseDirectory.AppLocalData,
      });
      for (const entry of entries) {
        if (entry.name.endsWith(".mp3")) {
          const trackpath = filepath + "/" + entry.name;
          const trackname = entry.name.slice(0, -4);
          const requestBody = {
            name: trackname,
            path: trackpath,
          };
          try {
            const response = await axios.post(`${db_url}/tracks`, requestBody);
            console.log("Track added to database:", response.data);
          } catch (error) {
            console.error("Error fetching data: ", error);
          }
        }
      }
    }
  }, []);

  const handlePlay = useCallback(async () => {
    await invoke("play_track");
    setPlayState(true);
  }, []);

  const handlePause = useCallback(async () => {
    await invoke("pause_track");
    setPlayState(false);
  }, []);

  const handleNext = useCallback(async () => {
    console.log("Current Track:", currentTrack);
    if (currentTrack) {
      // console.log('Current Track:', currentTrack);
      const trackListLen = tracks.length;
      const nextTrackIndex = (tracks.indexOf(currentTrack) + 1) % trackListLen;
      const nextTrack = tracks[nextTrackIndex];
      console.log("Next Track:", nextTrack);
      if (nextTrack) {
        setCurrentTrack(nextTrack);
        const nextpath = nextTrack.path;
        await invoke("load_track", { filePath: nextpath });
        setPlayState(true);
      }
    }
  }, [currentTrack, tracks, setCurrentTrack, invoke]);

  const handleLast = useCallback(async () => {
    console.log("Current Track:", currentTrack);
    if (currentTrack) {
      // console.log('Current Track:', currentTrack);
      const trackListLen = tracks.length;
      const lastTrackIndex = (tracks.indexOf(currentTrack) - 1) % trackListLen;
      const lastTrack = tracks[lastTrackIndex];
      console.log("Last Track:", lastTrack);
      if (lastTrack) {
        setCurrentTrack(lastTrack);
        const nextpath = lastTrack.path;
        await invoke("load_track", { filePath: nextpath });
        setPlayState(true);
      }
    }
  }, [currentTrack, tracks, setCurrentTrack, invoke]);

  const formatSecond = (seconds: number): String => {
    const rounded = Math.round(seconds);
    const m = Math.floor(rounded / 60);
    const s = rounded % 60;

    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getTrackAlbum = async (track: Track) => {
    await invoke("get_album", { album_id: track.album_id }).then((data) => {
      const album = data as Album;
      if (album) {
        setAlbumName(album.name);
      }
    });
  };

  useEffect(() => {
    if (currentTrack) {
      getTrackAlbum(currentTrack);
    }
  }, [currentTrack]);

  return (
    <main>
      {/* Main page , beside sidebar */}
      <Card className="w-[750px] h-[375px]">
        <CardHeader>
          <Menubar>
            <MenubarMenu>
              <Button variant="ghost" className="w-[150px] font-bold italic">
                Rwave
              </Button>
              <Separator orientation="vertical" />
              <Button variant="link" className="w-[150px]">
                <div className="font-bold">t</div>
                track
              </Button>
              <Separator orientation="vertical" />
              <Button variant="link" className="w-[150px]">
                <div className="font-bold">p</div>
                playlist
              </Button>
              <Separator orientation="vertical" />
              <Button variant="link" className="w-[150px]">
                <div className="font-bold">a</div>
                artist
              </Button>
            </MenubarMenu>
          </Menubar>
        </CardHeader>
        <CardContent className="flex justify-start space-x-4 w-[300px]">
          <div>
            <ScrollTrackList />
          </div>
          <Separator orientation="vertical" />
          <div className="space-y-2 mb-4 w-[450px] flex flex-col">
            <Marquee className="font-semibold text-zinc-700 w-[450px]">
              {currentTrack
                ? currentTrack.name
                : "Something very very long in order to test the marquee, of course i wish it works"}
            </Marquee>
            <div className="flex justify-start items-center space-x-4 text-sm text-zinc-600">
              <div>{albumName}</div>
              <Separator orientation="vertical" />
              <div>Artist name</div>
            </div>
            {/* 
              I have no idea what to put here, at least for now
              So I just leave something to hold the space.
            */}
            {/* <Textarea
              className="h-[100px]"
              placeholder={The_Cyclops_in_Love}
            ></Textarea> */}
            <Card className="h-[150px]"></Card>
            <Slider
              value={[Math.round(position)]}
              max={Math.round(duration)}
              step={1}
              className="w-full justify-center flex"
            />
            <div className="flex justify-between items-center text-sm text-zinc-600">
              <span>{formatSecond(Math.round(position))}</span>
              <span>{formatSecond(Math.round(duration))}</span>
            </div>
          </div>
        </CardContent>
        <Separator className="my-0 width-[950px]" />
        <CardFooter className="flex justify-center gap-x-0">
          <Button variant="link" className="flex-none" onClick={handleLast}>
            <div className="font-bold">⏮</div>
            last track
          </Button>
          <Separator orientation="vertical" />
          {playState ? (
            <Button variant="link" className="flex-none" onClick={handlePause}>
              <div className="font-bold">⏸</div>
              pause
            </Button>
          ) : (
            <Button variant="link" className="flex-none" onClick={handlePlay}>
              <div className="font-bold">⏵</div>
              play
            </Button>
          )}
          <Separator orientation="vertical" />
          <Button variant="link" className="flex-none" onClick={handleNext}>
            <div className="font-bold">⏭</div>
            next track
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

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
import { useTrack } from "@/components/context/trackcontext";

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
  }, []);

  const handlePause = useCallback(async () => {
    await invoke("pause_track");
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
      }
    }
  }, [currentTrack, tracks, setCurrentTrack, invoke]);

  const formatSecond = (seconds: number): String => {
    const rounded = Math.round(seconds);
    const m = Math.floor(rounded / 60);
    const s = rounded % 60;

    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <main>
      <div className="flex flex-col">
        {/* Track List and Player Container */}
        <div className="flex max-w-[900px]">
          {/* Player */}
          <div className="max-w-[400px] w-full shadow-lg p-4 rounded-lg mx-auto">
            <div className="mb-4 justify-between space-x-2 flex items-center">
              <div className="text-lg font-semibold text-zinc-1000 overflow-hidden whitespace-nowrap">
                {currentTrack ? currentTrack.name : "No Track Selected"}
              </div>
              <Button variant="outline" size="icon" onClick={handleLoad}>
                <Folder className="w-10 h-10" />
              </Button>
            </div>
            <div className="space-y-2 mb-4">
              <Slider
                value={[Math.round(position)]}
                max={Math.round(duration)}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between items-center text-sm text-zinc-600">
                <span>{formatSecond(Math.round(position))}</span>
                <span>{formatSecond(Math.round(duration))}</span>
              </div>
            </div>

            <div className="flex justify-center items-center space-x-2">
              <Button variant="outline" size="icon" onClick={handleLast}>
                <SkipBack className="w-10 h-10" />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePlay}>
                <Play className="w-10 h-10" />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePause}>
                <Pause className="w-10 h-10" />
              </Button>
              <Button variant="outline" size="icon">
                <Square className="w-10 h-10" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <SkipForward className="w-10 h-10" />
              </Button>
            </div>
          </div>

          {/* Track List */}
          <div className="max-w-[300px] w-full mx-auto mt-4">
            {/* <div className='max-w-[300px] w-full p-4 mx-auto shadow-lg rounded-lg'> */}
            <ScrollTrackList />
          </div>
        </div>
      </div>
    </main>
  );
}

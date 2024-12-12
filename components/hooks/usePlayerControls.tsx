import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTrack } from "@/components/context/trackcontext";
import { usePlayStateContext } from "@/components/context/playstatecontext";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir, BaseDirectory } from "@tauri-apps/plugin-fs";
import { db_url } from "@/components/ui/tracklist";
import axios from "axios";
export const usePlayerControls = () => {
  const { currentTrack, setCurrentTrack, tracks } = useTrack();
  const { playState, setPlayState } = usePlayStateContext();

  const handlePlay = useCallback(async () => {
    await invoke("play_track");
    setPlayState(true);
  }, []);

  const handlePause = useCallback(async () => {
    await invoke("pause_track");
    setPlayState(false);
  }, []);

  const handleNext = useCallback(async () => {
    if (currentTrack) {
      const trackListLen = tracks.length;
      const nextTrackIndex = (tracks.indexOf(currentTrack) + 1) % trackListLen;
      const nextTrack = tracks[nextTrackIndex];
      if (nextTrack) {
        setCurrentTrack(nextTrack);
        await invoke("load_track", { filePath: nextTrack.path });
        setPlayState(true);
      }
    }
  }, [currentTrack, tracks, setCurrentTrack, invoke]);

  const handleLast = useCallback(async () => {
    if (currentTrack) {
      const trackListLen = tracks.length;
      const lastTrackIndex =
        tracks.indexOf(currentTrack) === 0
          ? trackListLen - 1
          : tracks.indexOf(currentTrack) - 1;
      const lastTrack = tracks[lastTrackIndex];
      if (lastTrack) {
        setCurrentTrack(lastTrack);
        await invoke("load_track", { filePath: lastTrack.path });
        setPlayState(true);
      }
    }
  }, [currentTrack, tracks, setCurrentTrack, invoke]);

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

  return { handlePlay, handlePause, handleNext, handleLast, handleLoad };
};

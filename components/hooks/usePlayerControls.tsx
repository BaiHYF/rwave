import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTrack } from "@/components/context/trackcontext";
import { usePlayStateContext } from "@/components/context/playstatecontext";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir, BaseDirectory } from "@tauri-apps/plugin-fs";
import { db_url } from "@/components/ui/tracklist";
import { Playlist, usePlaylist } from "@/components/context/playlistcontext";
import axios from "axios";
import { Track } from "@/components/context/trackcontext";
import { fetchAllTracksFromPlaylist, getDatabasePath } from "../utils/db-util";
export const usePlayerControls = () => {
  const { currentTrack, setCurrentTrack, tracks, setTracks } = useTrack();
  const { playState, setPlayState } = usePlayStateContext();
  const { playlist, setPlaylist, playlists, setPlaylists } = usePlaylist();

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
        await invoke("load_track", { filePath: nextTrack.Path });
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
        await invoke("load_track", { filePath: lastTrack.Path });
        setPlayState(true);
      }
    }
  }, [currentTrack, tracks, setCurrentTrack, invoke]);

  const handleLoadDir = useCallback(async () => {
    const filepath = await open({
      multiple: false,
      directory: true,
    });

    // 遍历文件夹下每一个 .mp3 文件，解析为 Track 对象，添加到数据库中
    if (filepath !== null) {
      const entries = await readDir(filepath as string, {
        baseDir: BaseDirectory.AppLocalData,
      });
      for (const entry of entries) {
        if (entry.name.endsWith(".mp3")) {
          const trackpath = filepath + "/" + entry.name;
          const datebaseURL = await getDatabasePath();
          // Definition of `add_track_command`
          // add_track_command(track_path: String, db_url: String)
          await invoke("add_track_command", {
            track_path: trackpath,
            db_url: datebaseURL,
          }).then((response) => {
            console.log(response);
          });
          // const trackname = entry.name.slice(0, -4);
          // const requestBody = {
          //   name: trackname,
          //   path: trackpath,
          // };
          // try {
          //   const response = await axios.post(`${db_url}/tracks`, requestBody);
          //   console.log("Track added to database:", response.data);
          // } catch (error) {
          //   console.error("Error fetching data: ", error);
          // }
        }
      }
      if (playlist !== null) {
        const trks = fetchAllTracksFromPlaylist(playlist);
        trks.then((data) => {
          const tracksData = data as Track[];
          setTracks(tracksData);
          console.log("Track data: ", tracksData);
          console.log("Tracks : ", tracks);
        });
      }
    }
  }, []);

  const handleLoadFile = useCallback(async () => {
    getDatabasePath();
    const filepath = await open({
      multiple: true,
      directory: false,
      filters: [
        {
          name: "Track File",
          extensions: ["mp3"],
        },
      ],
    });

    if (filepath !== null) {
      for (const path of filepath) {
        const trackpath = path;
        const datebaseURL = await getDatabasePath();
        // Definition of `add_track_command`
        // add_track_command(track_path: String, db_url: String)
        await invoke("add_track_command", {
          track_path: trackpath,
          db_url: datebaseURL,
        }).then((response) => {
          console.log(response);
        });
        // const trackname = path.slice(path.lastIndexOf("/") + 1, -4);

        // const requestBody = {
        //   name: trackname,
        //   path: path,
        // };
        // console.log(requestBody);
        // try {
        //   const response = await axios.post(`${db_url}/tracks`, requestBody);
        //   console.log(response.data);
        //   console.log("Track added to database.");
        // } catch (error) {}
      }
      if (playlist !== null) {
        const trks = fetchAllTracksFromPlaylist(playlist);
        trks.then((data) => {
          const tracksData = data as Track[];
          setTracks(tracksData);
          console.log("Track data: ", tracksData);
          console.log("Tracks : ", tracks);
        });
      }
    }
  }, []);

  return {
    handlePlay,
    handlePause,
    handleNext,
    handleLast,
    handleLoadDir,
    handleLoadFile,
  };
};

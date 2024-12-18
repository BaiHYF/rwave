"use client";
import { useEffect, useState } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import ScrollTrackList from "@/components/tracklist";
import { useTrack, Track } from "@/components/context/trackcontext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePlayStateContext } from "@/components/context/playstatecontext";
import Database from "@tauri-apps/plugin-sql";
import { PlayerControls } from "@/components/player-control";
import { usePlayerControls } from "@/components/hooks/usePlayerControls";
import PageHeader from "@/components/page-header";
import PlaylistPageBody from "@/components/playlist-page-body";

type PlayerEvent =
  | { event: "playing" }
  | { event: "paused" }
  | {
      event: "positionUpdate";
      data: {
        position: number;
        duration: number;
      };
    }
  | {
      event: "seeked";
      data: {
        position: number;
      };
    };

export default function Home() {
  // Define States
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const { currentTrack, setCurrentTrack, tracks, setTracks } = useTrack();
  const { playState, setPlayState } = usePlayStateContext();
  const [albumName, setAlbumName] = useState("Unknown Album");
  const [artistName, setArtistName] = useState("Unknown Artist");
  const [isSeeking, setIsSeeking] = useState(false);

  // Constants and functions
  const dbUrl = "sqlite:rwave.db";

  const {
    handlePlay,
    handlePause,
    handleNext,
    handleLast,
    handleLoadDir: handleLoad,
  } = usePlayerControls();

  const getTrackAlbum = async (track: Track) => {
    const db = await Database.load(dbUrl);
    const albumArr = (await db.select(
      "SELECT Name FROM Albums WHERE AlbumID = $1",
      [track.AlbumID]
    )) as Array<{ Name: string }>;

    if (albumArr.length > 0) {
      setAlbumName(albumArr[0].Name);
    } else {
      setAlbumName("Unknown Album");
    }
  };

  const getTrackArtist = async (track: Track) => {
    const db = await Database.load(dbUrl);
    const artistArr = (await db.select(
      "SELECT Name FROM Artists WHERE ArtistID = $1",
      [track.ArtistID]
    )) as Array<{ Name: string }>;

    if (artistArr.length > 0) {
      setArtistName(artistArr[0].Name);
    } else {
      setArtistName("Unknown Artist");
    }
  };

  // UseEffects

  useEffect(() => {
    const channel = new Channel<PlayerEvent>();

    channel.onmessage = (message) => {
      switch (message.event) {
        case "positionUpdate":
          if (!isSeeking) {
            setPosition(message.data.position);
            setDuration(message.data.duration);
          }
          break;
        case "seeked":
          console.log(message.event);
          setPosition(message.data.position);
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
  }, [isSeeking]);

  useEffect(() => {
    if (currentTrack) {
      getTrackAlbum(currentTrack);
      getTrackArtist(currentTrack);
    }
  }, [currentTrack]);

  return (
    <main>
      <Card className="w-[750px] h-[375px] space-y-0">
        <CardHeader>
          {/* PAGE HEADER FIXED */}
          <PageHeader />
        </CardHeader>
        <CardContent className="flex justify-start space-x-4 w-[300px]">
          {/* SCROLL TRACKLIST FIXED */}
          <div>
            <ScrollTrackList />
          </div>
          <Separator orientation="vertical" />

          {/* PAGE BODY DYNAMIC */}
          <PlaylistPageBody />
        </CardContent>
        <CardFooter className="flex flex-col justify-center gap-x-0">
          {/* PAGE FOOTER FIXED */}
          <Separator className="my-0 width-[950px]" />
          <PlayerControls
            handlePlay={handlePlay}
            handlePause={handlePause}
            handleNext={handleNext}
            handleLast={handleLast}
          />
        </CardFooter>
      </Card>
    </main>
  );
}

"use client";
import { useState } from "react";
import ScrollTrackList from "@/components/tracklist";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlayerControls } from "@/components/player-control";
import { usePlayerControls } from "@/components/hooks/usePlayerControls";
import PageHeader from "@/components/page-header";
import AboutPageBody from "@/components/about-page-body";
export default function Home() {
  // Define States
  const [TrackListRefreshTrigger, setTrackListRefreshTrigger] = useState(false);

  const { handlePlay, handlePause, handleNext, handleLast } =
    usePlayerControls();

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
            <ScrollTrackList
              TrackListRefreshTrigger={TrackListRefreshTrigger}
              setTrackListRefreshTrigger={setTrackListRefreshTrigger}
            />
          </div>
          <Separator orientation="vertical" />
          {/* PAGE BODY DYNAMIC */}
          <AboutPageBody />
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

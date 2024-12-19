import { invoke } from "@tauri-apps/api/core";
import { Slider } from "@/components/ui/slider";
import { Track } from "@/components/context/trackcontext";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Marquee } from "@/components/ui/marquee";
import { formatSecond } from "@/components/utils/formatSecond";
type TrackPageBodyProps = {
  currentTrack: Track | null;
  albumName: string;
  artistName: string;
  position: number;
  duration: number;
  isSeeking: boolean;
  setPosition: (position: number) => void;
  setIsSeeking: (isSeeking: boolean) => void;
};

const TrackPageBody = ({
  currentTrack,
  albumName,
  artistName,
  position,
  duration,
  setPosition,
  setIsSeeking,
}: TrackPageBodyProps) => {
  return (
    <div className="space-y-2 mb-4 w-[450px] flex flex-col">
      <Marquee className="font-semibold text-zinc-700 w-[450px]">
        {currentTrack ? currentTrack.Name : "No track selected yet :)"}
      </Marquee>
      <div className="flex justify-start items-center space-x-4 text-sm text-zinc-600">
        <div>{albumName}</div>
        <Separator orientation="vertical" />
        <div>{artistName}</div>
      </div>
      {/* 
      I have no idea what to put here, at least for now
      So I just leave something to hold the space.
    */}
      <Card className="h-[100px]"></Card>
      <Slider
        value={[Math.round(position)]}
        max={Math.round(duration)}
        step={1}
        className="w-full justify-center flex"
        onValueChange={(newvalue) => {
          setPosition(newvalue[0]);
          setIsSeeking(true);
        }}
        onValueCommit={async (newvalue) => {
          console.log("New value commited:", newvalue[0]);
          await invoke("seek_track", { position: newvalue[0] });
          setIsSeeking(false);
        }}
      />
      <div className="flex justify-between items-center text-sm text-zinc-600">
        <span>{formatSecond(Math.round(position))}</span>
        <span>{formatSecond(Math.round(duration))}</span>
      </div>
    </div>
  );
};

export default TrackPageBody;

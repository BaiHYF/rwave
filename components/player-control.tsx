import { Button } from "@/components/ui/button";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { usePlayStateContext } from "@/components/context/playstatecontext";

interface PlayerControlsProps {
  handlePlay: () => void;
  handlePause: () => void;
  handleNext: () => void;
  handleLast: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  handlePlay,
  handlePause,
  handleNext,
  handleLast,
}) => {
  const { playState } = usePlayStateContext();

  return (
    <div className="flex justify-center gap-x-0">
      <Button variant="link" className="flex-none" onClick={handleLast}>
        <div className="font-bold">⏮</div>
        last track
      </Button>
      <Button
        variant="link"
        className="flex-none"
        onClick={playState ? handlePause : handlePlay}
      >
        <div className="font-bold">{playState ? "⏸" : "⏵"}</div>
        {playState ? "pause" : "play"}
      </Button>
      <Button variant="link" className="flex-none" onClick={handleNext}>
        <div className="font-bold">⏭</div>
        next track
      </Button>
    </div>
  );
};

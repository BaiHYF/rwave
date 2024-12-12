为了优化 `app/page.tsx` 的代码结构，我们可以采取以下步骤：

1. **拆分组件**：将大组件拆分成更小的组件，这样可以提高代码的可读性和可维护性。
2. **分离逻辑**：将业务逻辑和UI分离，使用自定义钩子来处理复杂的逻辑。
3. **使用 TypeScript**：通过定义类型来减少错误并提高代码的可读性。

以下是优化后的代码结构示例：

### 1. 创建自定义钩子
在 `hooks` 文件夹下创建一个钩子 `usePlayerControls.ts` 来处理播放控制的逻辑：

```typescript
// hooks/usePlayerControls.ts
import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTrack } from "@/components/context/trackcontext";
import { usePlayStateContext } from "@/components/context/playstatecontext";

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

  return { handlePlay, handlePause, handleNext, handleLast };
};
```

### 2. 拆分组件
将 `Home` 组件拆分成更小的组件，例如 `PlayerHeader`, `PlayerContent`, `PlayerFooter` 等。

```tsx
// components/PlayerHeader.tsx
import { CardHeader, Menubar } from "@/components/ui";

const PlayerHeader = () => {
  return (
    <CardHeader>
      <Menubar>
        {/* Menubar content */}
      </Menubar>
    </CardHeader>
  );
};

export default PlayerHeader;
```

```tsx
// components/PlayerContent.tsx
import { CardContent, ScrollTrackList, Marquee, Slider, Separator } from "@/components/ui";
import { formatSecond } from "@/utils/formatSecond";

type PlayerContentProps = {
  currentTrack: Track | null;
  albumName: string;
  artistName: string;
  position: number;
  duration: number;
  isSeeking: boolean;
  setPosition: (position: number) => void;
  setIsSeeking: (isSeeking: boolean) => void;
};

const PlayerContent = ({
  currentTrack,
  albumName,
  artistName,
  position,
  duration,
  isSeeking,
  setPosition,
  setIsSeeking,
}: PlayerContentProps) => {
  return (
    <CardContent className="flex justify-start space-x-4 w-[300px]">
      {/* Content */}
    </CardContent>
  );
};

export default PlayerContent;
```

```tsx
// components/PlayerFooter.tsx
import { CardFooter, PlayerControls, Separator } from "@/components/ui";
import { usePlayerControls } from "@/hooks/usePlayerControls";

const PlayerFooter = () => {
  const { handlePlay, handlePause, handleNext, handleLast } = usePlayerControls();

  return (
    <CardFooter className="flex flex-col justify-center gap-x-0">
      <Separator className="my-0 width-[950px]" />
      <PlayerControls
        handlePlay={handlePlay}
        handlePause={handlePause}
        handleNext={handleNext}
        handleLast={handleLast}
      />
    </CardFooter>
  );
};

export default PlayerFooter;
```

### 3. 重构 `Home` 组件
将拆分后的组件整合到 `Home` 组件中：

```tsx
// app/page.tsx
import PlayerHeader from "@/components/PlayerHeader";
import PlayerContent from "@/components/PlayerContent";
import PlayerFooter from "@/components/PlayerFooter";

const Home = () => {
  // State and logic
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const { currentTrack, tracks } = useTrack();
  const { playState } = usePlayStateContext();
  const [albumName, setAlbumName] = useState("Unknown Album");
  const [artistName, setArtistName] = useState("Unknown Artist");

  // UseEffects and other logic

  return (
    <main>
      <Card className="w-[750px] h-[375px] space-y-0">
        <PlayerHeader />
        <PlayerContent
          currentTrack={currentTrack}
          albumName={albumName}
          artistName={artistName}
          position={position}
          duration={duration}
          isSeeking={isSeeking}
          setPosition={setPosition}
          setIsSeeking={setIsSeeking}
        />
        <PlayerFooter />
      </Card>
    </main>
  );
};

export default Home;
```

### 4. 定义类型
在 `types` 文件夹下定义相关的类型：

```typescript
// types/track.ts
export interface Track {
  id: number;
  name: string;
  path: string;
  album_id: number;
  artist_id: number;
}

export interface Album {
  id: number;
  name: string;
}

export interface Artist {
  id: number;
  name: string;
}
```

### 5. 其他工具函数
创建一个工具函数 `formatSecond` 来格式化时间：

```typescript
// utils/formatSecond.ts
export const formatSecond = (seconds: number): string => {
  const rounded = Math.round(seconds);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};
```

通过以上步骤，我们可以将复杂的 `Home` 组件拆分成更小、更易于管理和维护的组件和钩子，从而使代码结构更加清晰。
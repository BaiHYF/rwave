'use client'
import { Button } from "@/components/ui/button"
import { Folder, Pause, Play, SkipBack, SkipForward, Square } from "lucide-react";
import { useCallback, useEffect, useState } from 'react';
import { invoke, Channel } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog';
import { Slider } from "@/components/ui/slider";

type PlayerEvent = | { event : "playing" } | { event : "paused" } | 
  {
    event : "positionUpdate", 
    data : {
      position : number,
      duration : number
    } 
  };

export default function Home() {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // UseEffect: Run the functions whenever this Home() is mounted
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

    const subscriptionPromise = invoke('subscribe_player_event', { channel : channel });

    return () => {
      subscriptionPromise.then((id) => 
        invoke('unsubscribe_player_event', { id: id })
      );
    };
  }, []);


  const handleLoad = useCallback(async () => {
    const filepath = await open({
      multiple: false,
      directory: false,
      filters: [{
          name: 'Track',
          extensions: ['mp3', 'flac']
      }],
    });

    if (filepath !== null) {
      // Arguments should be passed as a JSON object with CAMELCASE keys !!!!!
      await invoke('load_track', {  filePath : filepath }); 
    }
  }, []);

  const handlePlay = useCallback(async () => {
    await invoke("play_track");
  }, []);

  const handlePause = useCallback(async () => {
    await invoke("pause_track");
  }, []);

  const formatSecond = (seconds: number) : String => {
    const rounded = Math.round(seconds);
    const m = Math.floor(rounded / 60);
    const s = rounded % 60;

    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return (
    <main className='max-w-[400px] w-full shadow-lg p-4 rounded-lg mx-auto'>
      <div className='mb-4 justify-between space-x-2 flex items-center'>
        <div className='text-lg font-semibold text-zinc-1000 overflow-hidden whitespace-nowrap'>
          I am the Currently playing Music
        </div>
          <Button variant="outline" size="icon" onClick={handleLoad}>
            <Folder className='w-10 h-10'/>
          </Button>
      </div>
      <div className='space-y-2 mb-4' >
        <Slider value={[Math.round(position)]} max={Math.round(duration)} step={1} className="w-full"/>
        <div className='flex justify-between items-center text-sm text-zinc-600'>
          <span>{formatSecond(Math.round(position))}</span>
          <span>{formatSecond(Math.round(duration))}</span>
        </div>
      </div>

      <div className='flex justify-center items-center space-x-2'>
        <Button variant="outline" size="icon">
          <SkipBack className='w-10 h-10' />
        </Button>
        <Button variant="outline" size="icon" onClick={handlePlay}>
          <Play className='w-10 h-10'/>
        </Button>
        <Button variant="outline" size="icon" onClick={handlePause}>
          <Pause className='w-10 h-10'/>
        </Button>
        <Button variant="outline" size="icon">
          <Square className='w-10 h-10'/>
        </Button>
        <Button variant="outline" size="icon">
          <SkipForward className='w-10 h-10'/>
        </Button>
      </div>
    </main>
  )
}

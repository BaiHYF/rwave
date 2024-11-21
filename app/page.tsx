'use client'
import { Button } from "@/components/ui/button"
import { Folder, Pause, Play, SkipBack, SkipForward, Square } from "lucide-react";
import { useCallback, useEffect } from 'react';
import { invoke, Channel } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog';
import { Slider } from "@/components/ui/slider";

type PlayerEvent = | { event : "playing" } | { event : "paused" };

export default function Home() {
  // UseEffect: Run the functions whenever this Home() is mounted
  useEffect(() => {
    const channel = new Channel<PlayerEvent>();

    channel.onmessage = (message) => {
      console.log(`got player event ${message.event}`);
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
        <Slider defaultValue={[50]} max={100} step={1} className="w-full"/>
        <div className='flex justify-between items-center text-sm text-zinc-600'>
          <span>01:00</span>
          <span>03:45</span>
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

'use client'

import { useRef } from 'react';
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog';
export default function PlayTrackButton() {
  const buttonRef = useRef<HTMLButtonElement>(null); 

  const handleClick = async () => { 
    if (buttonRef.current!.disabled) 
    { 
      return; 
    } 
    buttonRef.current!.disabled = true; 
    const filePath = await open({
      multiple: false,
      filters: [{
        name: 'Track',
        extensions: ['mp3', 'flac']
      }]
    });
    if (filePath !== null) {
      // Arguments should be passed as a JSON object with CAMELCASE keys !!!!!
      await invoke('play_track', {  filePath : filePath }); 
    } 

    buttonRef.current!.disabled = false; 
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Play
    </button>
  );
}
import React, {useState, useEffect } from "react";
import axios from "axios";
import { invoke, Channel } from '@tauri-apps/api/core'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
    SelectScrollUpButton,
    SelectScrollDownButton,
} from "@/components/ui/select"
import exp from "constants";
import { useTrack } from "@/components/trackcontext";


export interface Track {
    id : number,
    name : string,
    path : string,
}


export const db_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7744';
// export const [updateTrack, setUpdateTrack] = useState({id: '', name: '', path: ''});
// const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
// const [tracks, setTracks] = useState<Track[]>([]); // Tracks in current playlist


const TrackList = () => {
    // const [tracks, setTracks] = useState<Track[]>([]); // Tracks in current playlist
    // const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    // const [newTrack, setNewTrack] = useState({name: '', path: ''}); // To create a new track
    // const [updateTrack, setUpdateTrack] = useState({id: '', name: '', path: ''});

    const { currentTrack, setCurrentTrack, tracks, setTracks } = useTrack();
    const [selectedTrackName, setSelectedTrackName] = useState<string>("");

    useEffect(() => {
        const fetchAllTrack = async () => {
            try {
                const response = await axios.get(`${db_url}/tracks`);
                setTracks(response.data);
            } catch (error) {
                console.error('Error fetching data: ', error);
            }
        };

        if (tracks.length === 0) {
            fetchAllTrack();
        }

        if (tracks.length > 0) {
            if (currentTrack === null) {
                setCurrentTrack(tracks[0]);
            }
            if (currentTrack !== null) {
                setSelectedTrackName(currentTrack.name);
            }
        }
    }, [currentTrack]);

    const handleSelectChange = async (value: string) => {
        const selectedTrack = tracks.find(track => track.name === value);
        if (selectedTrack) {
            setCurrentTrack(selectedTrack);
            const filepath = selectedTrack.path;
              if (filepath !== null) {
                // Arguments should be passed as a JSON object with CAMELCASE keys !!!!!
                await invoke('load_track', {  filePath : filepath }); 
              }
        }

        // Reset the selected value to show the placeholder
        // const selectValueElement = document.querySelector('.select-value');
        // if (selectValueElement) {
        //     selectValueElement.textContent = 'Select a track';
        // }
    };

    return (
        <div>
            {tracks.length === 0 ? (
                <p>No tracks available.</p>
            ) : (
                <Select onValueChange={handleSelectChange} value={selectedTrackName}>
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder={currentTrack ? currentTrack.name : 'Select a track'} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectScrollUpButton />
                        <SelectGroup>
                            <SelectLabel>Default Playlist</SelectLabel>
                            {tracks.map((track) => (
                                <SelectItem key={track.id} value={track.name}>
                                    {track.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                        <SelectScrollDownButton />
                    </SelectContent>
                </Select>
            )}  
        </div>
    );
}

export default TrackList;

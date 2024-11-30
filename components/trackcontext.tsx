"use client";

import React, { createContext, useContext, useState } from 'react';

export interface Track {
  id: string;
  name: string;
  path: string;
}

export interface TrackContextType {
  currentTrack: Track | null;
  setCurrentTrack: React.Dispatch<React.SetStateAction<Track | null>>;
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
}

const TrackContext = createContext<TrackContextType | undefined>(undefined);

interface TrackProviderProps {
  children: React.ReactNode;
}

export const TrackProvider: React.FC<TrackProviderProps> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]); // Tracks in current playlist

  return (
    <TrackContext.Provider value={{ currentTrack, setCurrentTrack, tracks, setTracks }}>
      {children}
    </TrackContext.Provider>
  );
};

export const useTrack = () => {
  const context = useContext(TrackContext);
  if (context === undefined) {
    throw new Error('useTrack must be used within a TrackProvider');
  }
  return context;
};
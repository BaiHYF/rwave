"use client";

import React, { createContext, useContext, useState } from "react";

export interface Track {
  TrackID: number;
  Name: string;
  Path: string;
  ArtistID: number;
  AlbumID: number;
  Duration: number;
}

export interface Album {
  AlbumID: number;
  Name: string;
  ArtistID: number;
}

export interface Artist {
  ArtistID: number;
  Name: string;
}

export interface TrackContextType {
  currentTrack: Track | null; // Currently playing track
  setCurrentTrack: React.Dispatch<React.SetStateAction<Track | null>>;
  tracks: Track[]; // Tracks in current playlist
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
    <TrackContext.Provider
      value={{ currentTrack, setCurrentTrack, tracks, setTracks }}
    >
      {children}
    </TrackContext.Provider>
  );
};

export const useTrack = () => {
  const context = useContext(TrackContext);
  if (context === undefined) {
    throw new Error("useTrack must be used within a TrackProvider");
  }
  return context;
};

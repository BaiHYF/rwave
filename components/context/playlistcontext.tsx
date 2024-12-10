"use client";

import React, { createContext, useContext, useState } from "react";

export interface Playlist {
  playlist_id: number;
  name: string;
}

export interface PlaylistContextType {
  currentPlaylist: Playlist | null;
  setCurrentPlaylist: React.Dispatch<React.SetStateAction<Playlist | null>>;
  allPlaylists: Playlist[];
  setAllPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(
  undefined
);

interface PlaylistProviderProps {
  children: React.ReactNode;
}

export const PlaylistProvider: React.FC<PlaylistProviderProps> = ({
  children,
}) => {
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]); // Tracks in current playlist

  return (
    <PlaylistContext.Provider
      value={{
        currentPlaylist,
        setCurrentPlaylist,
        allPlaylists,
        setAllPlaylists,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error("usePlaylist must be used within a PlaylistProvider");
  }
  return context;
};

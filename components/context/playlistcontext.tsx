"use client";

import React, { createContext, useContext, useState } from "react";

export interface Playlist {
  playlist_id: number;
  name: string;
}

export interface PlaylistContextType {
  playlist: Playlist | null;
  setPlaylist: React.Dispatch<React.SetStateAction<Playlist | null>>;
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
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
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]);

  return (
    <PlaylistContext.Provider
      value={{
        playlist: currentPlaylist,
        setPlaylist: setCurrentPlaylist,
        playlists: allPlaylists,
        setPlaylists: setAllPlaylists,
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

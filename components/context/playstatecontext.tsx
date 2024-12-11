"use client";

import React, { createContext, useContext, useState } from "react";

// playing -> true
// not playing -> false

export interface PlayStateType {
  playState: boolean;
  setPlayState: React.Dispatch<React.SetStateAction<boolean>>;
}

const PlayStateContext = createContext<PlayStateType | undefined>(undefined);

export const PlayStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playState, setPlayState] = useState(false);

  return (
    <PlayStateContext.Provider value={{ playState, setPlayState }}>
      {children}
    </PlayStateContext.Provider>
  );
};

export const usePlayStateContext = () => {
  const context = useContext(PlayStateContext);
  if (context === undefined) {
    throw new Error(
      "usePlaylistContext must be used within a PlaylistProvider"
    );
  }
  return context;
};

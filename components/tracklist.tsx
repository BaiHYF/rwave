import React, { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTrack, Track } from "@/components/context/trackcontext";
import { usePlaylist, Playlist } from "./context/playlistcontext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayStateContext } from "./context/playstatecontext";
import { fetchAllTracksFromPlaylist, getDatabasePath } from "./utils/db-util";

interface ScrollTrackListProps {
  TrackListRefreshTrigger: boolean;
  setTrackListRefreshTrigger: React.Dispatch<React.SetStateAction<boolean>>;
}

const ScrollTrackList: React.FC<ScrollTrackListProps> = ({
  TrackListRefreshTrigger,
  setTrackListRefreshTrigger,
}) => {
  const { currentTrack, setCurrentTrack, tracks, setTracks } = useTrack();
  const {
    playlist,
    setPlaylist,
    playlists,
    setPlaylists,
    tracklistExecOnce,
    setTracklistExecOnce,
  } = usePlaylist();
  const { setPlayState } = usePlayStateContext();

  // const fetchAllPlaylist = async () => {
  //   const dbURL = await getDatabasePath();
  //   try {
  //     await invoke("get_all_playlists", { db_url: dbURL }).then((data) => {
  //       const playlistsData = data as Playlist[];
  //       setPlaylists(playlistsData);
  //     });
  //   } catch (error) {
  //     console.error("Error fetching data: ", error);
  //   }
  // };

  const fetchAllPlaylist = useCallback(async () => {
    const dbURL = await getDatabasePath();
    try {
      const data = await invoke("get_all_playlists", { db_url: dbURL });
      const playlistsData = data as Playlist[];
      setPlaylists(playlistsData);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  }, [setPlaylists]);

  useEffect(() => {
    fetchAllPlaylist();
  }, [fetchAllPlaylist]);

  useEffect(() => {
    const initScrollTrackList = async () => {
      await fetchAllPlaylist(); // wait for playlists to be fetched
    };
    initScrollTrackList();
  }, [fetchAllPlaylist]);

  // make sure `setPlaylist(playlists[0])` below executes only once when the app is mounted
  // const [execOnce, setExecOnce] = useState(true);
  useEffect(() => {
    // console.log("DEBUG: tracklist.tsx.40 execOnce: ", tracklistExecOnce);
    if (playlists.length > 0 && tracklistExecOnce) {
      setPlaylist(playlists[0]);
      setTracklistExecOnce(false);
    }
  }, [playlists, setPlaylist, setTracklistExecOnce, tracklistExecOnce]);

  useEffect(() => {
    console.log("DEBUG: tracklist.tsx.57 playlist: ", playlist);
    if (playlist !== null) {
      const trks = fetchAllTracksFromPlaylist(playlist);
      trks.then((data) => {
        const tracksData = data as Track[];
        setTracks(tracksData);
        // console.log("Track data: ", tracksData);
        console.log(
          "Tracklist.tsx: 61 -- number of tracks in scroll playlist -> ",
          tracks.length
        );
      });
    }
  }, [playlist, TrackListRefreshTrigger, setTracks, tracks.length]);

  const handleButtonClick = async (track: Track) => {
    setCurrentTrack(track);
    const filepath = track.Path;
    if (filepath !== null) {
      await invoke("load_track", { filePath: filepath });
      setPlayState(true);
    }
  };

  return (
    <div>
      <ScrollArea className="w-[200px] h-[200px] ">
        {tracks.length === 0 ? (
          <div>
            <p>Empty~ 😶‍🌫️.</p>
            <p>You may load/add some tracks first...</p>
          </div>
        ) : (
          <div>
            <span className="pt-2 font-semibold font-mono text-muted-foreground italic">
              {playlist?.name}
            </span>
            {tracks.map((track) => (
              <figure key={track.TrackID}>
                <div className="overflow-hidden">
                  <Button
                    onClick={() => handleButtonClick(track)}
                    variant="link"
                    className={`font-sans
                       ${
                         track === currentTrack ? "font-bold" : "text-zinc-500"
                       }`}
                  >
                    {track.Name}
                  </Button>
                </div>
              </figure>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ScrollTrackList;

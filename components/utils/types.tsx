export interface Track {
  id: number;
  name: string;
  path: string;
  album_id: number;
  artist_id: number;
}

export interface Album {
  id: number;
  name: string;
}

export interface Artist {
  id: number;
  name: string;
}

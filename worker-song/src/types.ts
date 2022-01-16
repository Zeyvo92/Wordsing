import { Url } from "url";

type PrimaryArtist = {
  id: number;
  name: string;
};

export type SongJob = {
  artistId: number;
};

export type Song = [
  {
    id: number;
    artist_names: string;
    full_title: string;
    title: string;
    url: Url;
    primary_artist: PrimaryArtist;
  }
];

export type SongResponse = {
  meta: { status: number };
  response: { songs: Song; next_page: number | null };
};

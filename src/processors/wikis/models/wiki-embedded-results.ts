import { WikiLinks } from "./wiki-links";

export interface PlayerParams {
  channel: string | null;
  muted: string | null;
  width: string | null;
  height: string | null;
}

export interface WikiEmbeddedResult extends WikiLinks {
  twitchIsEmbedded: boolean | null;
  playerParams: PlayerParams | null;
}

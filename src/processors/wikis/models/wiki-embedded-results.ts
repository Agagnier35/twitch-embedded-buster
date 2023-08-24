import { WikiLinks } from "./wiki-links";

export interface WikiEmbeddedResult extends WikiLinks {
  twitchIsEmbedded: boolean | null;
  channel: string | null;
}

import { TwitchGame } from "../../twitch/models/game";

export interface WikiLinks {
  title: string;
  link: string;
  game: TwitchGame;
  keyword: string;
}

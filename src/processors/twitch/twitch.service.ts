import axios, { AxiosError } from "axios";
import queryString from "querystring";
import { TwitchGame } from "./models/game";
import { BlackListGames } from "../../blacklists/games";

const auth_url = "https://id.twitch.tv/oauth2/token";

const TwitchAxios = axios.create({ baseURL: "https://api.twitch.tv/helix" });

TwitchAxios.interceptors.request.use(async (config) => {
  const access_token = await TwitchService.getCredentials();
  config.headers.set("Client-Id", process.env.TWITCH_CLIENT_ID);
  config.headers.set("Authorization", "Bearer " + access_token);
  return config;
});
TwitchAxios.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    console.log(error);
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      console.error("Error 401 detected");
      originalRequest._retry = true;

      try {
        const access_token = TwitchService.getCredentials();
        originalRequest.headers["Authorization"] = access_token;
        const res = await axios.request(originalRequest);
        return Promise.resolve(res);
      } catch (refreshTokenError) {
        console.error("Unable to retry query");
        return Promise.reject(refreshTokenError);
      }
    }
    return Promise.reject(error);
  }
);

export const TwitchService = {
  getCredentials: async () => {
    console.log("Getting new credentials...");
    const res = await axios
      .post(
        auth_url,
        // https://axios-http.com/docs/urlencoded
        queryString.stringify({
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
        { headers: { "content-type": "application/x-www-form-urlencoded" } }
      )
      .then((res) => res.data);

    return res.access_token;
  },

  getTopGames: async () => {
    console.log("Fetching all games");
    const { data }: { data: TwitchGame[] } = await TwitchAxios.get(
      `/games/top?first=${50}`
    );

    const actualGames = data.filter(
      (game) => !BlackListGames.includes(game.name)
    );

    console.log(actualGames);
    return actualGames;
  },
};

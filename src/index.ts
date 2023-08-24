import puppeteer from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import "dotenv/config";
import {
  WikiLinks,
  navigateToSearch,
  searchWikis,
} from "./processors/search/search.puppet";
import { SearchEngine } from "./search-engines/config";
import { TwitchService } from "./processors/twitch/twitch.service";
import { filterUniqueDomains } from "./processors/wikis/wiki.puppet";

puppeteer.use(Stealth());

(async () => {
  try {
    const games = await TwitchService.getTopGames();

    const browser = await puppeteer.launch({
      devtools: true,
      headless: true,
    });

    try {
      console.log("Web Browser opened");

      const allLinks = await Promise.allSettled(
        games.map(async (game) => {
          const engine: SearchEngine = "DuckDuckGo";
          const page = await navigateToSearch(browser, engine);
          return searchWikis(page, engine, game);
        })
      );
      const wikiLinks = allLinks
        .filter(
          (promise): promise is PromiseFulfilledResult<WikiLinks[]> =>
            promise.status === "fulfilled"
        )
        .flatMap((promise) => promise.value);

      const uniqueLinks = filterUniqueDomains(wikiLinks);
      console.log(uniqueLinks);
    } finally {
      await browser.close();
    }
    return 0;
  } catch (err) {
    console.error("Process Failed");
    console.error(err);
    return 1;
  }
})();

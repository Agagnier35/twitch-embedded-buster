import puppeteer from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import "dotenv/config";
import {
  navigateToSearch,
  searchWikis,
} from "./processors/search/search.puppet";
import { SearchEngine } from "./search-engines/config";
import { TwitchService } from "./processors/twitch/twitch.service";
import {
  filterUniqueDomains,
  findTwitchEmbed,
} from "./processors/wikis/wiki.puppet";
import { WikiLinks } from "./processors/wikis/models/wiki-links";
import { WikiEmbeddedResult } from "./processors/wikis/models/wiki-embedded-results";

puppeteer.use(Stealth());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

(async () => {
  try {
    const games = await TwitchService.getTopGames();

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-gpu", "--window-size=848x480p"],
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

      console.log("Starting crawling wikis ...");
      const reports = await Promise.all(
        uniqueLinks.map((link) => findTwitchEmbed(browser, link))
      );

      // const losers = reports.filter((report) => report.twitchIsEmbedded);
      // console.log("Losers:");
      // console.log(losers);

      // const failed = reports.filter(
      //   (report) => report.twitchIsEmbedded === null
      // );
      // console.log("Failed:");
      // console.log(failed);
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

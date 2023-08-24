//import puppeteer from "puppeteer-extra";
import { chromium } from "playwright-extra";
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

chromium.use(Stealth());
chromium.plugins.setDependencyDefaults("stealth/evasions/webgl.vendor", {
  vendor: "Bob",
  renderer: "Alice",
});

(async () => {
  try {
    //const games = await TwitchService.getTopGames();

    const browser = await chromium.launch({
      headless: false,
    });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    });

    try {
      console.log("Web Browser opened");

      // const allLinks = await Promise.allSettled(
      //   games.map(async (game) => {
      //     const engine: SearchEngine = "DuckDuckGo";
      //     const page = await navigateToSearch(context, engine);
      //     return searchWikis(page, engine, game);
      //   })
      // );
      // const wikiLinks = allLinks
      //   .filter(
      //     (promise): promise is PromiseFulfilledResult<WikiLinks[]> =>
      //       promise.status === "fulfilled"
      //   )
      //   .flatMap((promise) => promise.value);
      // const uniqueLinks = filterUniqueDomains(wikiLinks);

      const uniqueLinks = [
        {
          title: "fextralife",
          link: "https://baldursgate3.wiki.fextralife.com/Baldur's+Gate+3+Wiki",
        },
      ];

      console.log("Starting crawling wikis ...");
      const reports = await Promise.all(
        uniqueLinks.map((link) => findTwitchEmbed(context, link))
      );

      const losers = reports.filter((report) => report.twitchIsEmbedded);
      console.log("Losers:");
      console.log(losers);

      const failed = reports.filter(
        (report) => report.twitchIsEmbedded === null
      );
      console.log("Failed:");
      console.log(failed);
    } finally {
      //await browser.close();
    }
    // return 0;
  } catch (err) {
    console.error("Process Failed");
    console.error(err);
    return 1;
  }
})();

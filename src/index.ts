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
import { BasePlaywright } from "./utils/puppet";
import { Cluster } from "playwright-cluster";
import { createObjectCsvWriter } from "csv-writer";
import { SiteKeywords } from "./whitelists/keywords";

(async () => {
  try {
    const games = await TwitchService.getTopGames();

    const engine: SearchEngine = "DuckDuckGo";

    const searchCluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,

      playwright: BasePlaywright,
      maxConcurrency: 5,
    });
    const wikiCluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,

      playwright: BasePlaywright,
      maxConcurrency: 5,
    });

    try {
      const links: WikiLinks[] = [];
      await searchCluster.task(async ({ page, data }) =>
        links.push(
          ...(await searchWikis(page, data.engine, data.keyword, data.game))
        )
      );

      const combos = games.flatMap((game) =>
        SiteKeywords.map((keyword) => ({ engine, keyword, game }))
      );
      await Promise.all(combos.map((combo) => searchCluster.queue(combo)));

      await searchCluster.idle();

      const uniqueLinks = filterUniqueDomains(links);

      // const uniqueLinks = [
      //   {
      //     title: "loserA",
      //     link: "https://nwdb.info/",
      //   },
      //   {
      //     title: "loserB",
      //     link: "https://baldursgate3.wiki.fextralife.com/Baldur's+Gate+3+Wiki",
      //   },
      // ];

      console.log("Starting crawling wikis ...");

      const reports: WikiEmbeddedResult[] = [];
      await wikiCluster.task(async ({ page, data }) =>
        reports.push(await findTwitchEmbed(page, data))
      );
      await Promise.all(uniqueLinks.map((link) => wikiCluster.queue(link)));

      await wikiCluster.idle();

      const header = [
        { id: "game.name", title: "NAME" },
        { id: "keyword", title: "KEYWORD" },
        { id: "title", title: "WEBSITE TITLE" },
        { id: "link", title: "WEBSITE LINK" },
        { id: "twitchIsEmbedded", title: "TWITCH PLAYER FOUND" },
        { id: "playerParams.channel", title: "CHANNEL NAME" },
        { id: "playerParams.width", title: "WIDTH" },
        { id: "playerParams.height", title: "HEIGHT" },
        { id: "playerParams.muted", title: "MUTED" },
      ];

      const losers = reports.filter((report) => report.twitchIsEmbedded);
      const loserWriter = createObjectCsvWriter({
        path: "./busted-embedders.csv",
        headerIdDelimiter: ".",
        header,
      });
      await loserWriter.writeRecords(losers);

      const noMatches = reports.filter((report) => !report.twitchIsEmbedded);
      const noMatchesWriter = createObjectCsvWriter({
        path: "./scanned-websites.csv",
        headerIdDelimiter: ".",
        header,
      });
      await noMatchesWriter.writeRecords(noMatches);

      const failed = reports.filter(
        (report) => report.twitchIsEmbedded === null
      );
      console.log("Failed Crawls:");
      console.log(failed);
    } finally {
      await searchCluster.close();
      await wikiCluster.close();
    }
    return 0;
  } catch (err) {
    console.error("Process Failed");
    console.error(err);
    return 1;
  }
})();

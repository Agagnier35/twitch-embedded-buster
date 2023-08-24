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

(async () => {
  try {
    const games = await TwitchService.getTopGames();
    const keywords = ["wiki", "database"];
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
        keywords.map((keyword) => ({ engine, keyword, game }))
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

      const losers = reports.filter((report) => report.twitchIsEmbedded);
      console.log("Losers:");
      console.log(losers);

      const failed = reports.filter(
        (report) => report.twitchIsEmbedded === null
      );
      console.log("Failed:");
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

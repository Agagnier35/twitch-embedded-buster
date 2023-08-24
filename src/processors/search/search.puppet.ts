import { BlacklistedWebsites } from "../../blacklists/website";
import { SearchEngine, SearchEngines } from "../../search-engines/config";
import { TwitchGame } from "../twitch/models/game";
import { WikiLinks } from "../wikis/models/wiki-links";
import { Page } from "playwright";

export const navigateToSearch = async (
  page: Page,
  searchEngine: SearchEngine
) => {
  const engine = SearchEngines[searchEngine];
  await page.goto(engine.url, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(engine.searchSelector);
};

export const searchWikis = async (
  page: Page,
  searchEngine: SearchEngine,
  keyword: string,
  game: TwitchGame
): Promise<WikiLinks[]> => {
  await navigateToSearch(page, searchEngine);

  // Input Search Query
  const engine = SearchEngines[searchEngine];

  const blackListQueryString = BlacklistedWebsites.map(
    (s) => engine.minusSitePrefix + s
  ).join(" ");
  await page.type(
    engine.searchSelector,
    `${game.name} ${keyword} ${blackListQueryString}`
  );

  await Promise.all([
    await page.keyboard.press("Enter"),

    // Scrape Page 1
    await page.waitForLoadState("domcontentloaded"),
    await page.waitForSelector(engine.linkSelector),
  ]);
  console.log(
    `Scrapping First Page search results for game ${game.name} (${keyword})...`
  );

  const scraps1 = await page.$$eval(engine.linkSelector, async (els) =>
    (els as HTMLElement[])
      .filter((e) => e.parentElement?.childElementCount === 1)
      .map((e) => ({
        title: e.innerText,
        link: (e as HTMLAnchorElement).href,
      }))
  );

  //Navigate Page 2
  await Promise.all([
    await page.click(engine.pageSelector),
    await page.waitForLoadState("domcontentloaded"),
  ]);
  console.log(
    `Scrapping Second Page search results for game ${game.name} (${keyword})...`
  );

  // Scrape Page 2
  const scraps2 = await page.$$eval(engine.linkSelector, async (els) =>
    (els as HTMLElement[])
      .filter((e) => e.parentElement?.childElementCount === 1)
      .map((e) => ({
        title: e.innerText,
        link: (e as HTMLAnchorElement).href,
      }))
  );

  console.log(`Links scrapped for ${game.name} (${keyword})`);
  await page.close();
  return [...scraps1, ...scraps2].map((link) => ({ ...link, game, keyword }));
};

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

  await page.keyboard.press("Enter"),
    console.log(
      `Scrapping First Page search results for game ${game.name} (${keyword})...`
    );
  const scraps1 = await scrapePage(page, searchEngine);

  console.log(
    `Scrapping Second Page search results for game ${game.name} (${keyword})...`
  );
  const scraps2 = await scrapePage(page, searchEngine);

  console.log(
    `Scrapping Thirsd Page search results for game ${game.name} (${keyword})...`
  );
  const scraps3 = await scrapePage(page, searchEngine);

  console.log(`Links scrapped for ${game.name} (${keyword})`);
  await page.close();
  return [...scraps1, ...scraps2, ...scraps3].map((link) => ({
    ...link,
    game,
    keyword,
  }));
};

const scrapePage = async (page: Page, searchEngine: SearchEngine) => {
  const engine = SearchEngines[searchEngine];

  //Navigate Page 3
  await Promise.all([
    await page.click(engine.pageSelector),
    await page.waitForLoadState("domcontentloaded"),
  ]);

  // Scrape Page 3
  return await page.$$eval(engine.linkSelector, async (els) =>
    (els as HTMLElement[])
      .filter((e) => e.parentElement?.childElementCount === 1)
      .map((e) => ({
        title: e.innerText,
        link: (e as HTMLAnchorElement).href,
      }))
  );
};

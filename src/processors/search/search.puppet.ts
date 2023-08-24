import { Browser, Page } from "puppeteer";
import { BlacklistedWebsites } from "../../blacklists/website";
import { SearchEngine, SearchEngines } from "../../search-engines/config";
import { TwitchGame } from "../twitch/models/game";
import { WikiLinks } from "../wikis/models/wiki-links";

export const navigateToSearch = async (
  browser: Browser,
  searchEngine: SearchEngine
) => {
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );

  const engine = SearchEngines[searchEngine];
  await page.goto(engine.url, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(engine.searchSelector, {
    visible: true,
  });
  return page;
};

export const searchWikis = async (
  page: Page,
  searchEngine: SearchEngine,
  game: TwitchGame
): Promise<WikiLinks[]> => {
  // Input Search Query
  const engine = SearchEngines[searchEngine];

  const blackListQueryString = BlacklistedWebsites.map(
    (s) => engine.minusSitePrefix + s
  ).join(" ");
  await page.type(
    engine.searchSelector,
    `${game.name} wiki ${blackListQueryString}`
  );

  await Promise.all([
    await page.keyboard.press("Enter"),

    // Scrape Page 1
    await page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    await page.waitForSelector(engine.linkSelector),
  ]);
  console.log(`Scrapping First Page search results for game ${game.name}...`);

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
    await page.waitForNetworkIdle(),
  ]);
  console.log(`Scrapping Second Page search results for game ${game.name}...`);

  // Scrape Page 2
  const scraps2 = await page.$$eval(engine.linkSelector, async (els) =>
    (els as HTMLElement[])
      .filter((e) => e.parentElement?.childElementCount === 1)
      .map((e) => ({
        title: e.innerText,
        link: (e as HTMLAnchorElement).href,
      }))
  );

  console.log(`Links scrapped for ${game.name}`);
  await page.close();
  return [...scraps1, ...scraps2];
};

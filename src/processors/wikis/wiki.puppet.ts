import { WikiLinks } from "./models/wiki-links";
import { WikiEmbeddedResult } from "./models/wiki-embedded-results";
import { onlyUnique } from "../../utils/array";
import { Page } from "playwright";

export const filterUniqueDomains = (links: WikiLinks[]) =>
  Object.values(
    links.reduce((acc, link) => {
      try {
        const linkURL = new URL(link.link);
        if (!acc[linkURL.host]) {
          acc[linkURL.host] = link;
        }
      } catch (err) {
        console.error(`Invalid URL: ${link.link}`);
      }

      return acc;
    }, {} as Record<string, WikiLinks>)
  );

const navigateToWiki = async (page: Page, link: WikiLinks) => {
  console.log(`Navigating to Wiki: ${link.link}`);
  await page.goto(link.link, {
    waitUntil: "load",
  });
  // Some page are slow? and the player has not loaded yet
  await page.waitForTimeout(2000);
  console.log(`Loaded Wiki: ${link.link}`);
};

export const findTwitchEmbed = async (
  page: Page,
  link: WikiLinks
): Promise<WikiEmbeddedResult> => {
  await navigateToWiki(page, link);
  try {
    const embedTwitchFound = await page.$$eval(
      "[src*='embed.twitch.tv']",
      (e) => (e as HTMLScriptElement[] | HTMLIFrameElement[]).map((e) => e.src)
    );
    const twitchPlayerFound = await page.$$eval(
      "[src*='player.twitch.tv']",
      (e) => (e as HTMLScriptElement[] | HTMLIFrameElement[]).map((e) => e.src)
    );

    const potentialMatches = embedTwitchFound.length + twitchPlayerFound.length;

    console.log(
      potentialMatches > 0
        ? "\x1b[32m%s\x1b[0m" //green
        : "\x1b[31m%s\x1b[0m", //red
      `${potentialMatches} Potential Embedded Twitch Found on ${link.link}`
    );

    let channel: string | null = null;

    if (potentialMatches) {
      channel = [...embedTwitchFound, ...twitchPlayerFound]
        .map((src) => new URL(src).searchParams.get("channel"))
        .filter((v): v is string => !!v)
        .filter(onlyUnique)
        .join(", ");
    }

    return {
      ...link,
      twitchIsEmbedded: potentialMatches > 0,
      channel,
    };
  } catch (err) {
    console.error(err);
    return { ...link, twitchIsEmbedded: null, channel: null };
  } finally {
    await page.close();
  }
};

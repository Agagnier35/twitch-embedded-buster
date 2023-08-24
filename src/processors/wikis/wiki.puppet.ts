import { WikiLinks } from "./models/wiki-links";
import { WikiEmbeddedResult } from "./models/wiki-embedded-results";
import { onlyUnique } from "../../utils/array";
import { Browser, BrowserContext } from "playwright";

export const filterUniqueDomains = (links: WikiLinks[]) =>
  Object.values(
    links.reduce((acc, link) => {
      const linkURL = new URL(link.link);
      if (!acc[linkURL.host]) {
        acc[linkURL.host] = link;
      }
      return acc;
    }, {} as Record<string, WikiLinks>)
  );

const navigateToWiki = async (browser: BrowserContext, { link }: WikiLinks) => {
  const page = await browser.newPage();
  //   await page.setUserAgent(
  //     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  //   );

  console.log(`Navigating to Wiki: ${link}`);
  await page.goto(link, {
    waitUntil: "load",
  });
  console.log(`Loaded Wiki: ${link}`);
  return page;
};

export const findTwitchEmbed = async (
  browser: BrowserContext,
  link: WikiLinks
): Promise<WikiEmbeddedResult> => {
  const page = await navigateToWiki(browser, link);
  try {
    const embeddedTwitch = await page.$$eval("script", (scripts) =>
      scripts.filter((script) =>
        script.innerHTML.includes("https://embed.twitch.tv/embed/v1.js")
      )
    );
    console.log(
      `Embedded Twitch${embeddedTwitch ? "" : " Not"} Found on ${link.link}`
    );

    let channel: string | null = null;
    if (embeddedTwitch) {
      const embeddedTwitchConstructorScript = await page.$$eval(
        "script",
        (scripts) =>
          scripts
            .filter((script) => script.innerHTML.includes("Twitch.Embed"))
            .map((script) => script.innerHTML)
      );

      console.log(
        `Found ${embeddedTwitchConstructorScript.length} Twitch Embed scripts on ${link.link}`
      );

      if (embeddedTwitchConstructorScript) {
        // Matches the channel field in the required options object for the Twitch API
        // Tries to match even if the object is a JSON or a JS object with ot without the possible quotes for a string
        const channelOptionRegex =
          /((")*channel(")*):("|'|`)((\\("|'|`)|[^("|'|`)])*)"/;
        const channelGroupIndex = 5;

        const possibleChannelNames = embeddedTwitchConstructorScript.map(
          (script) => script.match(channelOptionRegex)?.[channelGroupIndex]
        );

        console.log(
          `Parsed ${possibleChannelNames.length} possible embedded losers on ${link.link}`
        );
        channel = possibleChannelNames.filter(onlyUnique).join(", ");
      }
    }
    return {
      ...link,
      twitchIsEmbedded: !!embeddedTwitch,
      channel,
    };
  } catch (err) {
    console.error(err);
    return { ...link, twitchIsEmbedded: null, channel: null };
  } finally {
    //await page.close();
  }
};

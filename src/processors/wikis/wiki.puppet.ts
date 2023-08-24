import { WikiLinks } from "../search/search.puppet";

export const filterUniqueDomains = (links: WikiLinks[]) =>
  links.reduce((acc, link) => {
    const linkURL = new URL(link.link);
    if (!acc[linkURL.host]) {
      acc[linkURL.host] = link;
    }
    return acc;
  }, {} as Record<string, WikiLinks>);

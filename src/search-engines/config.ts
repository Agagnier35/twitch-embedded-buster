export const SearchEngines = {
  Google: {
    name: "Google",
    url: "http://google.com",
    minusSitePrefix: "-inurl:",
    searchSelector: 'textarea[aria-label="Search"]',
    linkSelector: ".LC20lb",
    pageSelector: "a[aria-label='Page 2']",
    // extractElement: async (e: HTMLElement): Promise<WikiLinks> => ({
    //   title: e.innerText,
    //   link: new URL((e?.parentNode as HTMLAnchorElement).href),
    // }),
  },
  DuckDuckGo: {
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/",
    minusSitePrefix: "-site:",
    searchSelector: 'input[aria-label="Search with DuckDuckGo"]',
    linkSelector: 'a[data-testid="result-title-a"]',
    pageSelector: "button#more-results",
  },
} as const;

export type SearchEngine = keyof typeof SearchEngines;

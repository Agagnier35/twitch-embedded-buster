# twitch-embedded-buster

## Disclaimer

This project is a Web Crawler that aims to raise awareness about Embedded Twitch Streams.

Embedding a twitch stream in itself isn't a bad thing, however this system is easily exploited by individuals. By Embedding a stream into their webpage, they are able to fluff their viewer counts. They effectively give the streamers more "viewers" - but the issue is that they aren't actual viewers.

Ultimately, the more streamers that embed their streams...

- the more "fake" viewer counts on channels
- less engagement on sponsored content per viewer
- less money in the ecosystem to pay to streamers for sponsored content

Ultimately, "exposing" the streamers won't do anything, the real fix to the problem has to be done by Twitch by not counting embedded streams views. It is my belief that Twitch already has everything needed to differentiate embedded streams to normal streams. [A embedded stream is REQUIRED to import Twitch's Embedding library](https://dev.twitch.tv/docs/embed/everything/) (also how this tool detects them). By using more effectively this library, they could easily differentiate between normal viewers and embedded viewers.

[This project was created following the bounty/interest by Gothalion.](https://twitter.com/Gothalion/status/1694443873412493495?s=20)

## Results

The results can be consulted by opening the `busted-embedders.csv` file.

**This list is very likely to be incomplete, for reasons explained in the Methodology - Cons Section**

## Methodology

Scraping the webpage is generally the easiest part. As they need to use the Twitch Embedded Library or the API, we only need to query the HTML for either the Embedded Library URL or the Twitch Player URL. They also need to pass the channel name as parameter into this URL allowing us to get the streamer name.

However, the hard part is to know which page to crawl. We obviously cannot brute force URL and i don't believe there's a list of website either.
The approach this crawler takes is the same as a normal person: use a search engine.

These are the steps the crawler will take:

1. Use Twitch API to get the Top 100 games, the final results will a bit less due to blacklisted categories like Just Chatting, Special Events, etc... ([Full List](src/blacklists/games.ts))
2. For each Game, open a Search Engine to search `<Game Name> + <keyword>`.
   - Those keywords are frequently used by these kind of websites. ([Full List](src/whitelists/keywords.ts))
   - A list of blacklisted websites is also provided to the engine ([Full List](src/blacklists/website.ts))
   - A list of all the websites in the first 2 pages is extracted (a user almost never goes further).
3. From that list of URL, we visit each one and search for the Twitch libraries

### Pros

- This process is similar to a real person, and will thus target the most popular websites first
- Detection of Twitch Library is very easy
- It is very hard for them, to avoid this detection without impacting normal users (implementing Captcha, etc...)

### Cons

- While this tool is currently able to avoid being recognized as a bot, this might not last for long
  - Strangely enough, from all the Websites I tried to scrape, only the wikis had anti-bot protections.
- The reliance on the search engine, means the websites that are found are likely to be in my language and popular in my region (Canada English). It will very likely not detect Websites in other languages.
  - The search engine is **DuckDuckGo** as Google had too many anti-bot measures
- Some websites do not embed if the streamer is not Live, so depending at what time the crawler runs, some websites might show as negative.
- While detection has been pretty easy, it's possible some web devs were clever with their embed and were able to dodge the detection. Inspecting the website to learn their tricks, will make this tool stronger.

## Contributing

For now, i am not looking for contributors, however please open an issue, for any Embedders I missed.

Please provide Evidence to the embedding, the website URL, and i'll investigate why they were missed.

## Roadmap

- Learn more Embedding tricks to make this tool be more reliant
- Add more keywords to find more websites
- Add a UI, because the CSV format is not user friendly
- Make the Crawler run periodically

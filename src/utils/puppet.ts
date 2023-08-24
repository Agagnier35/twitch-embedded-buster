import { chromium } from "playwright-extra";
import Stealth from "puppeteer-extra-plugin-stealth";

chromium.use(Stealth());
chromium.plugins.setDependencyDefaults("stealth/evasions/webgl.vendor", {
  vendor: "Bob",
  renderer: "Alice",
});

export const BasePlaywright = chromium;

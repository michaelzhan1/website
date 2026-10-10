// @ts-check
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { hastExternalLinks } from "./src/hast/external-links";

import sitemap from "@astrojs/sitemap";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://mzhan.dev/",
  integrations: [sitemap(), icon()],
  markdown: {
    processor: satteri({
      hastPlugins: [hastExternalLinks],
    }),
  },
});

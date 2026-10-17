// @ts-check
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { hastExternalLinks } from "./src/plugins/hast/external-links";

import sitemap from "@astrojs/sitemap";

import icon from "astro-icon";
import { satteriKatex } from "./src/plugins/latex/katex";

// https://astro.build/config
export default defineConfig({
  site: "https://mzhan.dev/",
  integrations: [sitemap(), icon()],
  markdown: {
    processor: satteri({
      features: { math: true },
      hastPlugins: [satteriKatex, hastExternalLinks],
    }),
  },
});

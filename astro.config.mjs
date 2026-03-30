import { defineConfig } from "astro/config";

import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [preact()],
  build: {
    format: "preserve",
  },
  prerenderConflictBehavior: "ignore",
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
  },
});

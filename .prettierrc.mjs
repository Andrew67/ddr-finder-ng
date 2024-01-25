import * as pluginAstro from "prettier-plugin-astro";

/** @type {import("prettier").Config} */
export default {
  plugins: [pluginAstro],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
};

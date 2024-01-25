import colors from "tailwindcss/colors";
import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      {
        "ddrfinder-light": {
          primary: colors.blue["900"],
          secondary: colors.fuchsia["700"],
          accent: colors.lime["700"],
          neutral: colors.slate["900"],
          "base-100": colors.blue["50"],
          "base-200": colors.blue["100"],
          "base-300": colors.blue["200"],
          info: colors.cyan["700"],
          success: colors.green["700"],
          warning: colors.orange["700"],
          error: colors.red["800"],
        },
      },
    ],
  },
  plugins: [daisyui],
};

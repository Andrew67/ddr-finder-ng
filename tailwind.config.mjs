import colors from "tailwindcss/colors";
import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      screens: {
        // Shrink or move some fixed elements on shorter devices,
        // such as Nexus 5 (500px height with Chrome), any rotated phone, etc.
        short: { raw: "(max-height: 567.98px)" },
        tall: { raw: "(min-height: 568px)" },
      },
      spacing: {
        "inset-top": "env(safe-area-inset-top)",
        "inset-right": "env(safe-area-inset-right)",
        "inset-bottom": "env(safe-area-inset-bottom)",
        "inset-left": "env(safe-area-inset-left)",
      },
    },
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
      {
        "ddrfinder-dark": {
          primary: colors.blue["200"],
          secondary: colors.fuchsia["200"],
          accent: colors.lime["200"],
          neutral: colors.slate["100"],
          "base-100": colors.slate["900"],
          "base-200": colors.slate["800"],
          "base-300": colors.slate["700"],
          info: colors.cyan["200"],
          success: colors.green["200"],
          warning: colors.orange["200"],
          error: colors.red["300"],
        },
      },
    ],
    darkTheme: "ddrfinder-dark",
  },
  plugins: [daisyui],
};

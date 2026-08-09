/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { createI18n, localeFrom, browser, formatter } from "@nanostores/i18n";
import { persistentAtom } from "@nanostores/persistent";

export const setting = persistentAtom<string | undefined>("locale", undefined);

const LOCALES = ["en", "es"] as const;
// type Locale = (typeof LOCALES)[number];

// TODO: Use Locale strict type
// TODO: Custom browser detector that matches language stems so locales can be en-US, es-419, and zh-Hans-CN
export const $locale = localeFrom(
  setting, // User’s locale from localStorage
  browser({
    // or browser’s locale auto-detect
    available: LOCALES,
    fallback: LOCALES[0],
  }),
);

export const format = formatter($locale);

export const i18n = createI18n($locale, {
  async get(code) {
    const response = await fetch(`/translations/${code}.json`);
    return response.json();
  },
});

/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { createI18n, localeFrom, browser, formatter } from "@nanostores/i18n";
import { persistentAtom } from "@nanostores/persistent";

const LOCALES = ["en", "es", "ja", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const setting = persistentAtom<Locale>("locale", LOCALES[0]);

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

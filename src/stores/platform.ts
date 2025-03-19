/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { atom, computed } from "nanostores";

const isPlatform = (platform: string) =>
  typeof navigator !== "undefined" && navigator.userAgent.includes(platform);

/** Whether it's a mobile device. Does not match iPad Pro due to cloaking */
export const $isMobile = atom(isPlatform("Mobile"));
export const $isMac = atom(isPlatform("Mac OS X"));
export const $isIos = computed(
  [$isMac, $isMobile],
  (isMac, isMobile) => isMac && isMobile,
);

export const $isAndroid = atom(isPlatform("Android"));

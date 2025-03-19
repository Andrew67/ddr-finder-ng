/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { atom } from "nanostores";

const isPlatform = (platform: string) =>
  typeof navigator !== "undefined" && navigator.userAgent.includes(platform);

export const $isMac = atom(isPlatform("Mac OS X"));
export const $isAndroid = atom(isPlatform("Android"));

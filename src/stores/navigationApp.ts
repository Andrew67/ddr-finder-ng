/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { computed } from "nanostores";
import { $isAndroid, $isMac } from "./platform.ts";

const navigationUrls = {
  googleMaps: "https://maps.google.com/?q=loc:${lat},${lng}(${name})",
  appleMaps: "maps:?q=${name}&ll=${lat},${lng}",
  androidGeo: "geo:${lat},${lng}?q=${lat},${lng}(${name})",
  // TODO: Double-encoded intent: version for Android
} as const;

// TODO: Preferred navigation app setting for iOS
export const $navigationUrl = computed(
  [$isMac, $isAndroid],
  (isMac, isAndroid) => {
    if (isMac) return navigationUrls.appleMaps;
    if (isAndroid) return navigationUrls.androidGeo;
    return navigationUrls.googleMaps;
  },
);

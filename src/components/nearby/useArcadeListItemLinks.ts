/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { ArcadeLocation } from "../../api-types/all";
import { useStore } from "@nanostores/preact";
import { $activeSource } from "../../stores/sources.ts";
import { $navigationUrl } from "../../stores/navigationApp.ts";

type ArcadeListItemLinks = {
  navigateUrl: string;
  moreInfoUrl: string;
  moreInfoMobileUrl: string;
};

/** Prepares the "Navigate" and "More Info" URLs for a given location */
export const useArcadeListItemLinks = (
  location: ArcadeLocation,
): ArcadeListItemLinks => {
  const activeSource = useStore($activeSource);
  const navigationUrl = useStore($navigationUrl);

  if (!activeSource)
    return { navigateUrl: "", moreInfoUrl: "", moreInfoMobileUrl: "" };

  const [lng, lat] = location.geometry.coordinates;
  const { name, sid } = location.properties;

  return {
    navigateUrl: navigationUrl
      .replaceAll("${lat}", String(lat))
      .replaceAll("${lng}", String(lng))
      .replaceAll("${name}", encodeURIComponent(name)),
    moreInfoUrl: activeSource["url:info"].replace("${sid}", sid),
    moreInfoMobileUrl: activeSource["url:info:mobile"].replace("${sid}", sid),
  };
};

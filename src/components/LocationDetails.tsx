/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { IconInfoSquareRounded, IconNavigation } from "@tabler/icons-preact";

import type { ArcadeLocationWithDistance } from "@/api-types/nearby";

import { useArcadeListItemLinks } from "./useArcadeListItemLinks";
import { IconPlatformShare } from "./IconPlatformShare";

const distanceFormatter = new Intl.NumberFormat("en-US", {
  style: "unit",
  unit: "kilometer",
  maximumFractionDigits: 2,
});

type ArcadeListItemProps = {
  location: ArcadeLocationWithDistance;
};

export const LocationDetails: FunctionComponent<ArcadeListItemProps> = (
  props,
) => {
  const { location } = props;
  const { properties } = location;

  const hasDDR = properties["has:ddr"] > 0;
  const hasPIU = properties["has:piu"] > 0;
  const hasSMX = properties["has:smx"] > 0;
  const hasDanceGames = hasDDR || hasPIU || hasSMX;

  const { navigateUrl, moreInfoUrl, moreInfoMobileUrl } =
    useArcadeListItemLinks(location);

  const isShareAvailable = "share" in navigator;

  const onShareClick = () => {
    const gamesText = hasDanceGames
      ? `Games: ${hasDDR ? "DDR " : ""}${hasPIU ? "PIU " : ""}${
          hasSMX ? "SMX " : ""
        }\n`
      : "";

    const shareText = `${properties.name}
${properties.city}
${gamesText}`;
    navigator.share({ text: shareText, url: moreInfoMobileUrl });
  };

  return (
    <ul>
      {properties.city && (
        <li>
          <i>{properties.city}</i>
        </li>
      )}
      {properties.distanceKm >= 0 && (
        <li>
          Approximately <b>{distanceFormatter.format(properties.distanceKm)}</b>{" "}
          away
        </li>
      )}
      {hasDanceGames && (
        <li className="flex gap-1 items-baseline">
          Games:
          {hasDDR && <span className="badge badge-primary">DDR</span>}
          {hasPIU && <span className="badge badge-secondary">PIU</span>}
          {hasSMX && <span className="badge badge-accent">SMX</span>}
        </li>
      )}
      <li className="flex flex-wrap gap-2 mt-4 print:hidden">
        <a
          href={navigateUrl}
          className="arcade-nav btn btn-accent"
          target="_blank"
        >
          <IconNavigation aria-hidden="true" /> Navigate
        </a>
        <a
          href={moreInfoMobileUrl}
          className="arcade-info btn btn-primary sm:hidden"
          target="_blank"
        >
          <IconInfoSquareRounded aria-hidden="true" />
          Info
        </a>
        <a
          href={moreInfoUrl}
          className="arcade-info btn btn-primary hidden sm:inline-flex"
          target="_blank"
        >
          <IconInfoSquareRounded aria-hidden="true" />
          More Info
        </a>
        {/* Simulate `btn-square` for small screens but expand at `sm` */}
        {isShareAvailable && (
          <button
            type="button"
            className="btn min-w-12 px-0 sm:px-4 btn-secondary"
            onClick={onShareClick}
            title="Share"
          >
            <IconPlatformShare aria-hidden="true" />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}
      </li>
    </ul>
  );
};

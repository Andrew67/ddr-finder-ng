/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useMemo } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { params } from "@nanostores/i18n";
import { IconInfoSquareRounded, IconNavigation } from "@tabler/icons-preact";

import type { ArcadeLocationWithDistance } from "@/api-types/nearby";
import { $locale, i18n } from "@/stores/i18n.ts";

import { useArcadeListItemLinks } from "./useArcadeListItemLinks";
import { IconPlatformShare } from "./IconPlatformShare";

export const messages = i18n("locationDetails", {
  distance: params("Approximately {distanceKm} away"),
  games: "Games:",
  navigate: "Navigate",
  info: "Info",
  moreInfo: "More Info",
  share: "Share",
});

type ArcadeListItemProps = {
  location: ArcadeLocationWithDistance;
};

export const LocationDetails: FunctionComponent<ArcadeListItemProps> = (
  props,
) => {
  const locale = useStore($locale);
  const t = useStore(messages);

  const { location } = props;
  const { properties } = location;

  const distanceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "kilometer",
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const distanceKm = useMemo(
    () =>
      properties.distanceKm >= 0
        ? distanceFormatter.format(properties.distanceKm)
        : "",
    [properties.distanceKm, distanceFormatter],
  );

  const hasDDR = properties["has:ddr"] > 0;
  const hasPIU = properties["has:piu"] > 0;
  const hasSMX = properties["has:smx"] > 0;
  const hasDanceGames = hasDDR || hasPIU || hasSMX;

  const { navigateUrl, moreInfoUrl, moreInfoMobileUrl } =
    useArcadeListItemLinks(location);

  const isShareAvailable = "share" in navigator;

  const onShareClick = () => {
    const gamesText = hasDanceGames
      ? `${t.games} ${hasDDR ? "DDR " : ""}${hasPIU ? "PIU " : ""}${
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
      {distanceKm && <li>{t.distance({ distanceKm })}</li>}
      {hasDanceGames && (
        <li className="flex gap-1 items-baseline">
          {t.games}
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
          <IconNavigation aria-hidden="true" /> {t.navigate}
        </a>
        <a
          href={moreInfoMobileUrl}
          className="arcade-info btn btn-primary sm:hidden"
          target="_blank"
        >
          <IconInfoSquareRounded aria-hidden="true" />
          {t.info}
        </a>
        <a
          href={moreInfoUrl}
          className="arcade-info btn btn-primary hidden sm:inline-flex"
          target="_blank"
        >
          <IconInfoSquareRounded aria-hidden="true" />
          {t.moreInfo}
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
            <span className="hidden sm:inline">{t.share}</span>
          </button>
        )}
      </li>
    </ul>
  );
};

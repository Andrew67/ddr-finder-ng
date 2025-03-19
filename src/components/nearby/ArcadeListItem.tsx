/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import type { ArcadeLocationWithDistance } from "../../api-types/nearby";
import { IconExternalLink, IconNavigation } from "@tabler/icons-preact";
import { useArcadeListItemLinks } from "./useArcadeListItemLinks.ts";
import { IconPlatformShare } from "../IconPlatformShare.tsx";

type ArcadeListItemPlaceholderProps = { isLoading: boolean };

export const ArcadeListItemPlaceholder: FunctionComponent<
  ArcadeListItemPlaceholderProps
> = (props) => {
  const { isLoading } = props;
  return (
    <li
      className={`collapse bg-base-200 ${isLoading ? "skeleton" : ""}`}
      aria-label="Empty placeholder for arcade location"
    >
      <div className="collapse-title !cursor-auto"></div>
    </li>
  );
};

const distanceFormatter = new Intl.NumberFormat("en-US", {
  style: "unit",
  unit: "kilometer",
  maximumFractionDigits: 2,
});

type ArcadeListItemProps = {
  location: ArcadeLocationWithDistance;
  index?: number;
};

export const ArcadeListItem: FunctionComponent<ArcadeListItemProps> = (
  props,
) => {
  const { location, index } = props;
  const { id, properties } = location;

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
    <li>
      <article className="collapse collapse-arrow bg-base-200 print:collapse-open print:border print:rounded">
        <input type="checkbox" name={`arcade-accordion-${id}`} />
        <div className="collapse-title text-lg font-medium">
          {index != undefined && (
            <span className="badge badge-secondary px-0 w-5 me-1 -translate-y-0.5">
              {index + 1}
            </span>
          )}
          {properties.name}
        </div>
        <ul className="collapse-content">
          {properties.city && (
            <li>
              <i>{properties.city}</i>
            </li>
          )}
          <li>
            Approximately{" "}
            <b>{distanceFormatter.format(properties.distanceKm)}</b> away
          </li>
          {hasDanceGames && (
            <li className="flex gap-1 items-baseline">
              Games:
              {hasDDR && <span className="badge badge-primary">DDR</span>}
              {hasPIU && <span className="badge badge-secondary">PIU</span>}
              {hasSMX && <span className="badge badge-accent">SMX</span>}
            </li>
          )}
          <li className="flex flex-wrap gap-2 mt-4 print:hidden">
            <a href={navigateUrl} className="arcade-nav btn btn-accent">
              <IconNavigation aria-hidden="true" /> Navigate
            </a>
            <a
              href={moreInfoMobileUrl}
              className="arcade-info btn btn-primary sm:hidden"
              target="_blank"
            >
              <IconExternalLink aria-hidden="true" />
              More Info
            </a>
            <a
              href={moreInfoUrl}
              className="arcade-info btn btn-primary hidden sm:inline-flex"
              target="_blank"
            >
              <IconExternalLink aria-hidden="true" />
              More Info
            </a>
            {isShareAvailable && (
              <button
                type="button"
                className="arcade-gmaps btn btn-secondary"
                onClick={onShareClick}
              >
                <IconPlatformShare aria-hidden="true" /> Share
              </button>
            )}
          </li>
        </ul>
      </article>
    </li>
  );
};

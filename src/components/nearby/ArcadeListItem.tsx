/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import type { ArcadeLocationWithDistance } from "../../api-types/nearby";
import {
  IconExternalLink,
  IconNavigation,
  IconShare,
} from "@tabler/icons-preact";
import { useCallback } from "preact/hooks";

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
      <div className="collapse-title"></div>
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
  const [lng, lat] = location.geometry.coordinates;

  const hasDDR = properties["has:ddr"] > 0;
  const hasPIU = properties["has:piu"] > 0;
  const hasSMX = properties["has:smx"] > 0;
  const hasDanceGames = hasDDR || hasPIU || hasSMX;

  const onShareClick = useCallback(() => {
    // TODO: Check for share API compatibility; fall back to clipboard; share more fields
    navigator.share({ text: properties.name });
  }, [location]);

  return (
    <li>
      <article class="collapse collapse-arrow bg-base-200 print:collapse-open print:border print:rounded">
        <input type="checkbox" name={`arcade-accordion-${id}`} />
        <div className="collapse-title text-lg font-medium">
          {index != undefined && (
            <span class="badge badge-secondary px-0 w-5 me-1 -translate-y-0.5">
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
            <li class="flex gap-1 items-baseline">
              Games:
              {hasDDR && <span className="badge badge-primary">DDR</span>}
              {hasPIU && <span className="badge badge-secondary">PIU</span>}
              {hasSMX && <span className="badge badge-accent">SMX</span>}
            </li>
          )}
          <li className="flex flex-wrap gap-2 mt-4 print:hidden">
            {/* TODO: Dynamic navigation URL */}
            <a
              href={`https://maps.google.com/?q=loc:${lat},${lng}(${encodeURIComponent(
                properties.name,
              )})`}
              className="arcade-nav btn btn-accent"
            >
              <IconNavigation aria-hidden="true" /> Navigate
            </a>
            {/* TODO: Read from sources; mobile link */}
            <a
              href={`https://zenius-i-vanisher.com/v5.2/arcade.php?id=${properties.sid}#summary`}
              className="arcade-info btn btn-primary"
              target="_blank"
            >
              <IconExternalLink aria-hidden="true" />
              <span>More Info</span>
            </a>
            <button
              type="button"
              className="arcade-gmaps btn btn-secondary"
              onClick={onShareClick}
            >
              <IconShare aria-hidden="true" /> Share
            </button>
          </li>
        </ul>
      </article>
    </li>
  );
};

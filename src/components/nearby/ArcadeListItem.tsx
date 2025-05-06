/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import type { ArcadeLocationWithDistance } from "@/api-types/nearby";
import { LocationDetails } from "../LocationDetails";

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

type ArcadeListItemProps = {
  location: ArcadeLocationWithDistance;
  index?: number;
};

export const ArcadeListItem: FunctionComponent<ArcadeListItemProps> = (
  props,
) => {
  const { location, index } = props;
  const { id, properties } = location;

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
        <div className="collapse-content">
          <LocationDetails location={location} />
        </div>
      </article>
    </li>
  );
};

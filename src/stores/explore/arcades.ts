/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { computed, type ReadableAtom } from "nanostores";
import type { FilterSpecification } from "mapbox-gl";

import { $activeSourceId } from "../sources.ts";
import { $gameFilter } from "../gameFilter.ts";

const $filter: ReadableAtom<FilterSpecification | undefined> = computed(
  $gameFilter,
  (gameFilter) => {
    if (gameFilter.length === 0) return undefined;
    return [
      "any",
      ...gameFilter.map(
        (filter) =>
          [">=", ["get", `has:${filter}`], 1] satisfies FilterSpecification,
      ),
    ];
  },
);

// TODO: Consider supported filters based on source `has` fields, not hard-coding this to ZIV only
export const $arcadesFilter = computed(
  [$activeSourceId, $filter],
  (src, filter) => (src === "ziv" ? filter : undefined),
);

export const $arcadesUrl = computed(
  $activeSourceId,
  (activeSourceId) =>
    activeSourceId &&
    `https://ddrfinder-api.andrew67.com/v4/all/${encodeURIComponent(activeSourceId)}.geojson`,
);

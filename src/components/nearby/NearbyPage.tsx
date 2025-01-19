/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { IconCurrentLocation } from "@tabler/icons-preact";
import type { h, FunctionComponent } from "preact";
import { useMemo } from "preact/hooks";
import { useStore } from "@nanostores/preact";

import {
  $userLocation,
  $userLocationError,
  $userLocationLoading,
  clearLocationError,
  getLocationFromGps,
} from "../../stores/userLocation.ts";
import { $nearbyArcades } from "../../stores/nearby/arcades.ts";
import {
  $numLocationsToShow,
  $staticMap,
} from "../../stores/nearby/staticMap.ts";
import {
  ArcadeListItem,
  ArcadeListItemPlaceholder,
} from "./ArcadeListItem.tsx";
import { Accuracy } from "./Accuracy.tsx";
import { StaticMap } from "./StaticMap.tsx";
import { UserLocationError } from "./UserLocationError.tsx";
import { DataSourceAttribution } from "./DataSourceAttribution.tsx";

export const NearbyPage: FunctionComponent = () => {
  const userLocation = useStore($userLocation);
  const userLocationLoading = useStore($userLocationLoading);
  const userLocationError = useStore($userLocationError);

  const {
    data: apiResponse,
    loading: apiLoading,
    error: apiError,
  } = useStore($nearbyArcades);
  const arcades = apiResponse?.features || [];

  const isLoading = userLocationLoading || apiLoading;
  const showPlaceholders = apiResponse == undefined || isLoading;

  const staticMapProps = useStore($staticMap);
  const staticMapNumLocations = useStore($numLocationsToShow);

  const arcadeListPlaceholder = useMemo(
    () =>
      new Array(6)
        .fill(0)
        .map(() => <ArcadeListItemPlaceholder isLoading={isLoading} />),
    [isLoading],
  );

  const arcadeList = useMemo(
    () =>
      arcades.map((loc, idx) => (
        <ArcadeListItem
          location={loc}
          index={idx < staticMapNumLocations ? idx : undefined}
        />
      )),
    [arcades, staticMapNumLocations],
  );

  const locationError = useMemo(
    () => (
      <UserLocationError
        error={userLocationError}
        dismissClick={clearLocationError}
      />
    ),
    [userLocationError],
  );

  return (
    <>
      <h2 class="text-2xl mt-4 mx-4">Your location:</h2>
      <StaticMap {...staticMapProps} isLoading={isLoading} />
      <div class="mx-4 mb-4">
        <p class="h-6">
          {!showPlaceholders && userLocation?.accuracyMeters != null && (
            <Accuracy accuracy={userLocation.accuracyMeters} />
          )}
          {apiError && (
            <span class="font-bold text-error">
              Connection error. Please try again
            </span>
          )}
        </p>
        <p class="mb-4">
          <button
            type="button"
            class="btn btn-secondary"
            onClick={getLocationFromGps}
          >
            <IconCurrentLocation aria-hidden="true" /> New Search
          </button>
        </p>

        <h2 class="text-2xl">Nearby arcades:</h2>
        <p class="h-6 mb-2">
          <DataSourceAttribution />
        </p>
        <ul class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {showPlaceholders && arcadeListPlaceholder}
          {!showPlaceholders && arcadeList}
        </ul>
        {!showPlaceholders && arcades.length === 0 && (
          <>
            <p class="font-bold">No arcades found nearby!</p>
            <ul class="pl-7 list-disc">
              <li>If you have game filters enabled, try clearing them.</li>
              <li>Try a different data source setting.</li>
              <li>Use the Explore page to check out the entire world.</li>
              <li>Go to the data source website.</li>
            </ul>
          </>
        )}
        {locationError}

        <footer class="mt-6">
          <p class="mb-2">
            &copy; 2012&ndash;2025{" "}
            <a
              href="https://andrew67.com/"
              target="_blank"
              class="link link-info"
            >
              Andrés Cordero
            </a>
          </p>
          <p class="text-sm">
            No warranty is made regarding operation, and no accuracy or
            freshness of results is guaranteed.
            <br />
            Arrow icon from the{" "}
            <a
              href="https://www.stepmania.com/"
              target="_blank"
              class="link link-info"
            >
              StepMania 5
            </a>{" "}
            default noteskin.
            <br />
          </p>
        </footer>
      </div>
    </>
  );
};

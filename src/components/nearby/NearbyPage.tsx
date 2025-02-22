/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { IconCurrentLocation } from "@tabler/icons-preact";
import type { h, FunctionComponent } from "preact";
import { useMemo, useState } from "preact/hooks";
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
import { FilterSourceButtons } from "./FilterSourceButtons.tsx";
import { SearchSettings } from "../SearchSettings.tsx";

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

  /* Start Modals */
  const locationError = useMemo(
    () => (
      <UserLocationError
        error={userLocationError}
        dismissClick={clearLocationError}
      />
    ),
    [userLocationError],
  );

  const [searchSettingsOpen, setSearchSettingsOpen] = useState(false);

  const searchSettings = useMemo(
    () => (
      <SearchSettings
        open={searchSettingsOpen}
        dismissClick={() => setSearchSettingsOpen(false)}
      />
    ),
    [searchSettingsOpen],
  );
  /* End Modals */

  return (
    <>
      <h2 class="text-2xl mt-4 mx-4">Your location:</h2>
      <StaticMap {...staticMapProps} isLoading={isLoading} />
      <div class="mx-4 mb-4">
        <p class="min-h-6">
          {!showPlaceholders && userLocation?.accuracyMeters != null && (
            <Accuracy accuracy={userLocation.accuracyMeters} />
          )}
          {apiError && (
            <span class="font-bold text-error">
              Connection error. Please try again
            </span>
          )}
        </p>
        <p class="mb-4 flex gap-2 overflow-x-auto">
          <button
            type="button"
            class="btn btn-secondary"
            onClick={getLocationFromGps}
          >
            <IconCurrentLocation aria-hidden="true" /> New Search
          </button>
          <FilterSourceButtons
            filterClick={() => setSearchSettingsOpen(true)}
            sourceClick={() => setSearchSettingsOpen(true)}
          />
        </p>

        <h2 class="text-2xl">Nearby arcades:</h2>
        <ul class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 mt-2">
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
        <p class="min-h-6 mt-2 mb-6">
          <DataSourceAttribution />
        </p>

        <footer>
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
      {/* Modals */}
      {locationError}
      {searchSettings}
    </>
  );
};

/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { IconCurrentLocation } from "@tabler/icons-preact";
import type { h, FunctionComponent } from "preact";
import { useMemo } from "preact/hooks";

import { useStaticMap } from "./useStaticMap.ts";
import {
  ArcadeListItem,
  ArcadeListItemPlaceholder,
} from "./ArcadeListItem.tsx";
import { Accuracy } from "./Accuracy.tsx";
import { useStore } from "@nanostores/preact";
import {
  $userLocation,
  $userLocationLoading,
  getLocationFromGps,
} from "../../stores/userLocation.ts";
import { $nearbyArcades } from "../../stores/nearby/arcades.ts";

export const NearbyPage: FunctionComponent = () => {
  const userLocation = useStore($userLocation);
  const userLocationLoading = useStore($userLocationLoading);

  const { data: apiResponse, loading: apiLoading } = useStore($nearbyArcades);
  const arcades = apiResponse?.features || [];

  const isLoading = userLocationLoading || apiLoading;
  const showPlaceholders = apiResponse == undefined || isLoading;

  const staticMap = useStaticMap(userLocation, arcades);

  const mapImage = useMemo(
    () => (
      <div
        className={`box-content max-w-full bg-base-200 sm:mx-4 sm:border sm:border-primary ${
          isLoading ? "skeleton rounded-none" : ""
        }`}
        style={{
          width: staticMap.width,
          height: staticMap.lightThemeUrl.length > 0 ? null : staticMap.height,
        }}
      >
        {staticMap.lightThemeUrl.length > 0 && (
          <picture>
            <source
              media="screen and (prefers-color-scheme: dark)"
              srcSet={staticMap.darkThemeUrl}
            />
            <img
              src={staticMap.lightThemeUrl}
              width={staticMap.width}
              height={staticMap.height}
              alt="Map of your location and nearby arcade locations"
            />
          </picture>
        )}
      </div>
    ),
    [staticMap, isLoading],
  );

  const arcadeListPlaceholder = useMemo(
    () =>
      new Array(6)
        .fill(0)
        .map(() => <ArcadeListItemPlaceholder isLoading={isLoading} />),
    [isLoading],
  );

  const arcadeList = useMemo(
    () =>
      arcades.map((loc, idx) => <ArcadeListItem location={loc} index={idx} />),
    [arcades],
  );

  // TODO: Handle error update from geolocation
  // TODO: API success but no arcades found state
  // TODO: API error state

  return (
    <>
      <h2 class="text-2xl mt-4 mx-4">Your location:</h2>
      {mapImage}
      <div class="mx-4 mb-4">
        <p class="h-6">
          <Accuracy accuracy={userLocation?.accuracyMeters} />
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
        <p class="h-6 mb-2">&copy; Zenius -I- vanisher.com Contributors</p>
        <ul class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {showPlaceholders && arcadeListPlaceholder}
          {!showPlaceholders && arcadeList}
        </ul>

        <footer class="mt-6">
          <p class="mb-2">
            &copy; 2012&ndash;2024{" "}
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

import { IconCurrentLocation } from "@tabler/icons-preact";
import type { h, FunctionComponent } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import type { NearbyApiResponse } from "../../api-types/nearby";
import { useStaticMap } from "./useStaticMap.ts";
import { useUserLocation } from "./useUserLocation.ts";
import {
  ArcadeListItem,
  ArcadeListItemPlaceholder,
} from "./ArcadeListItem.tsx";
import { Accuracy } from "./Accuracy.tsx";

export const NearbyPage: FunctionComponent = () => {
  const [userLocation, userLocationError, getUserLocation] = useUserLocation();
  const [apiResponse, setApiResponse] = useState<NearbyApiResponse | null>(
    null,
  );
  const arcades = apiResponse?.features || [];

  const staticMap = useStaticMap(userLocation, arcades);
  const [isLoading, setIsLoading] = useState(false);

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
      new Array(5)
        .fill(0)
        .map(() => <ArcadeListItemPlaceholder isLoading={isLoading} />),
    [isLoading],
  );

  const arcadeList = useMemo(
    () =>
      arcades.map((loc, idx) => <ArcadeListItem location={loc} index={idx} />),
    [arcades],
  );

  const requestNewUserLocation = useCallback(() => {
    setApiResponse(null);
    setIsLoading(true);
    getUserLocation();
  }, []);

  useEffect(() => {
    setIsLoading(false);
    // TODO: Handle error update from geolocation
    if (userLocation == null) return;

    const latFixed = userLocation.coords.latitude.toFixed(4);
    const lngFixed = userLocation.coords.longitude.toFixed(4);

    // TODO: URL builder (source, lat/lng trim by accuracy, game filters)
    const apiUrl = new URL(
      "https://ddrfinder-api.andrew67.com/v4/nearby/ziv.geojson",
    );
    apiUrl.searchParams.set("ll", `${latFixed},${lngFixed}`);

    fetch(apiUrl.toString())
      .then((response) => response.json())
      .then((apiResponse) => {
        // TODO: API success but no arcades found state
        setApiResponse(apiResponse);
      })
      // TODO: API error state
      .finally(() => setIsLoading(false));
  }, [userLocation]);

  return (
    <>
      <h2 class="text-2xl mt-4 mx-4">Your location:</h2>
      {mapImage}
      <div class="mx-4 mb-4">
        <p class="h-6">
          <Accuracy accuracy={userLocation?.coords.accuracy} />
        </p>
        <p class="mb-4">
          <button
            type="button"
            class="btn btn-secondary"
            onClick={requestNewUserLocation}
          >
            <IconCurrentLocation aria-hidden="true" /> New Search
          </button>
        </p>

        <h2 class="text-2xl">Nearby arcades:</h2>
        <p class="h-6 mb-2">&copy; Zenius -I- vanisher.com Contributors</p>
        <ul class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {arcades.length === 0 && arcadeListPlaceholder}
          {arcades.length > 0 && arcadeList}
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

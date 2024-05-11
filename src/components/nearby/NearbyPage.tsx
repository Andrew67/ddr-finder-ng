import { IconCurrentLocation } from "@tabler/icons-preact";
import type { h, FunctionComponent } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import type { NearbyApiResponse } from "../../api-types/nearby";

export const NearbyPage: FunctionComponent = () => {
  const [apiResponse, setApiResponse] = useState<NearbyApiResponse>({
    type: "FeatureCollection",
    bbox: [0, 0, 0, 0],
    features: [],
  });

  const [mapUrl, setMapUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mapPlaceholder = useMemo(
    () => (
      <div
        className={`h-52 bg-base-200 max-w-screen-sm sm:mx-4 sm:border sm:border-primary ${
          isLoading ? "skeleton rounded-none" : ""
        }`}
        aria-label="Empty placeholder for map image"
      ></div>
    ),
    [isLoading],
  );

  const mapImage = useMemo(
    () => (
      <img
        className="w-[320px] h-52 bg-base-200 max-w-screen-sm sm:mx-4 sm:border sm:border-primary"
        src={mapUrl}
        alt="Map of your location and nearby arcade locations"
      />
    ),
    [mapUrl],
  );

  const arcadeListPlaceholder = useMemo(
    () =>
      new Array(5).fill(0).map((_, i) => (
        <li
          key={`placeholder-${i}`}
          class={`collapse bg-base-200 ${isLoading ? "skeleton" : ""}`}
          aria-label="Empty placeholder for arcade location"
        >
          <div class="collapse-title"></div>
        </li>
      )),
    [isLoading],
  );

  const arcades = apiResponse.features;
  const arcadeList = useMemo(
    () =>
      arcades.map((loc) => {
        const hasDanceGames =
          loc.properties["has:ddr"] > 0 ||
          loc.properties["has:piu"] > 0 ||
          loc.properties["has:smx"] > 0;
        return (
          <li key={`location-${loc.id}`}>
            <article class="collapse collapse-arrow bg-base-200 print:collapse-open print:border print:rounded">
              <input type="checkbox" name={`arcade-accordion-${loc.id}`} />
              <div className="collapse-title text-lg font-medium">
                {loc.properties.name}
              </div>
              <ul className="collapse-content">
                {hasDanceGames && (
                  <li class="flex gap-1 items-baseline">
                    Games:
                    {loc.properties["has:ddr"] > 0 && (
                      <span class="badge badge-primary">DDR</span>
                    )}
                    {loc.properties["has:piu"] > 0 && (
                      <span class="badge badge-secondary">PIU</span>
                    )}
                    {loc.properties["has:smx"] > 0 && (
                      <span class="badge badge-accent">SMX</span>
                    )}
                  </li>
                )}
              </ul>
            </article>
          </li>
        );
      }),
    [arcades],
  );

  useEffect(() => {
    setIsLoading(true);
    fetch(
      // TODO: URL builder (source, lat/lng, game filters)
      // Tokyo (from Google Chrome)
      // "https://ddrfinder-api.andrew67.com/v4/nearby/ziv.geojson?ll=35.6894,139.6917",
      // Dallas, TX
      // "https://ddrfinder-api.andrew67.com/v4/nearby/ziv.geojson?ll=32.9659,-97.0453",
      // Greensboro, NC
      "https://ddrfinder-api.andrew67.com/v4/nearby/ziv.geojson?ll=36.0696,-79.7895",
    )
      .then((response) => response.json())
      .then((apiResponse) => {
        // TODO: API success but no arcades found state
        setApiResponse(apiResponse);
        setMapUrl(
          // TODO: URL builder (user location, arcade locations)
          "https://api.mapbox.com/styles/v1/andrew67/clrwbi529011u01qseesn4gj9/static/pin-s+b91c1c(-79.7895,36.0696),pin-l-1+a21caf(-79.7917,36.0662),pin-l-2+a21caf(-79.8192,36.0635),pin-l-3+a21caf(-79.8381,36.0405),pin-l-4+a21caf(-79.8931,36.0582),pin-l-5+a21caf(-79.9119,36.0607)/auto/320x208@2x?access_token=pk.eyJ1IjoiYW5kcmV3NjciLCJhIjoiY2lxMDlvOHZoMDAxOWZxbm9tdnR1NjVubSJ9.35GV_5ZM6zS2R5KQCwBWqw",
        );
      })
      // TODO: API error state
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <h2 class="text-2xl mt-4 mx-4">Your location:</h2>
      {/* Add border border-primary when result is in */}
      {mapUrl.length === 0 && mapPlaceholder}
      {mapUrl.length > 0 && mapImage}
      <div class="mx-4 mb-4">
        <p class="h-6">Accuracy: approximately 80 meters</p>
        <p class="mb-4">
          <button type="button" class="btn btn-secondary">
            <IconCurrentLocation aria-hidden="true" /> New Search
          </button>
        </p>

        <h2 class="text-2xl">Nearby arcades:</h2>
        <p class="h-6 mb-2">&copy; OpenStreetMap Contributors</p>
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

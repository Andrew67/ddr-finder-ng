/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, Fragment, FunctionComponent } from "preact";
import { useMemo, useState } from "preact/hooks";
import { IconMapPin } from "@tabler/icons-preact";

import { useStore } from "@nanostores/preact";

import { i18n } from "@/stores/i18n.ts";
import {
  $userLocation,
  $userLocationError,
  $userLocationLoading,
  clearLocationError,
  getLocationFromGps,
} from "@/stores/userLocation";
import { $nearbyArcades } from "@/stores/nearby/arcades";
import { $numLocationsToShow, $staticMap } from "@/stores/nearby/staticMap";

import { ArcadeListItem, ArcadeListItemPlaceholder } from "./ArcadeListItem";
import { Accuracy } from "./Accuracy";
import { StaticMap } from "./StaticMap";
import { UserLocationError } from "./UserLocationError";
import { DataSourceAttribution } from "./DataSourceAttribution";
import { FilterSourceButtons } from "../FilterSourceButtons";
import { SearchSettings } from "../SearchSettings";

export const messages = i18n("nearbyPage", {
  useLocation: "Use location",
  yourLocation: "Your location:",
  connectionError: "Connection error. Please try again",
  nearbyArcades: "Nearby arcades:",
  noNearbyArcadesFound: "No arcades found nearby!",
  noNearbyArcadesAdvice1:
    "If you have game filters enabled, try clearing them.",
  noNearbyArcadesAdvice2: "Try a different data source setting.",
  noNearbyArcadesAdvice3: "Use the Explore page to check out the entire world.",
  noNearbyArcadesAdvice4: "Go to the data source website.",
  noWarranty:
    "No warranty is made regarding operation, and no accuracy or freshness of results is guaranteed.",
});

export const NearbyPage: FunctionComponent = () => {
  const t = useStore(messages);

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
      <h2 className="text-2xl mt-4 mx-4">{t.yourLocation}</h2>
      <StaticMap {...staticMapProps} isLoading={isLoading} />
      <p className="mx-4 min-h-6">
        {!showPlaceholders && userLocation?.accuracyMeters != null && (
          <Accuracy accuracy={userLocation.accuracyMeters} />
        )}
        {apiError && (
          <span className="font-bold text-error">{t.connectionError}</span>
        )}
      </p>
      {/* Vertical padding is for the scrollbar / the button focus outlines */}
      <p className="print:hidden mb-4 px-4 py-1 flex gap-2 overflow-x-auto">
        {/* Match `<geolocation>` icon/text in preparation for future integration */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={getLocationFromGps}
        >
          <IconMapPin aria-hidden="true" /> {t.useLocation}
        </button>
        <FilterSourceButtons
          filterClick={() => setSearchSettingsOpen(true)}
          sourceClick={() => setSearchSettingsOpen(true)}
        />
      </p>
      <div className="px-4 pb-4">
        <h2 className="text-2xl">{t.nearbyArcades}</h2>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 mt-2">
          {showPlaceholders && arcadeListPlaceholder}
          {!showPlaceholders && arcadeList}
        </ul>
        {!showPlaceholders && arcades.length === 0 && (
          <>
            <p className="font-bold">{t.noNearbyArcadesFound}</p>
            <ul className="pl-7 list-disc">
              <li>{t.noNearbyArcadesAdvice1}</li>
              <li>{t.noNearbyArcadesAdvice2}</li>
              <li>{t.noNearbyArcadesAdvice3}</li>
              <li>{t.noNearbyArcadesAdvice4}</li>
            </ul>
          </>
        )}
        <p className="min-h-6 mt-2 mb-6">
          <DataSourceAttribution />
        </p>

        <footer>
          <p className="mb-2">
            &copy; 2012&ndash;2026{" "}
            <a
              href="https://andrew67.com/"
              target="_blank"
              className="link link-info"
            >
              Andrés Cordero
            </a>
          </p>
          <p className="text-sm">{t.noWarranty}</p>
        </footer>
      </div>
      {/* Modals */}
      {locationError}
      {searchSettings}
    </>
  );
};

export default NearbyPage;

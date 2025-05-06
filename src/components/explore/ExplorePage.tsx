/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useMemo, useState } from "preact/hooks";

import { FilterSourceButtons } from "./FilterSourceButtons";
import { SearchSettings } from "../SearchSettings";
import { useStore } from "@nanostores/preact";
import { $selectedArcadeWithDistance } from "@/stores/explore/selectedArcade";
import { LocationDetails } from "../LocationDetails.tsx";

export const ExplorePage: FunctionComponent = () => {
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

  const selectedArcade = useStore($selectedArcadeWithDistance);

  return (
    <>
      {/* Bottom right controls, which become bottom left on short screens */}
      <div
        className={
          "fixed short:bottom-20 short:pt-inset-top short:left-2 short:pl-inset-left " +
          "tall:right-2 tall:pr-inset-right tall:bottom-28 tall:sm:bottom-24 tall:pb-inset-bottom " +
          "flex flex-col gap-2"
        }
      >
        <FilterSourceButtons
          filterClick={() => setSearchSettingsOpen(true)}
          sourceClick={() => setSearchSettingsOpen(true)}
        />
      </div>
      {/* Selected location details card */}
      {/* TODO: Appear/disappear animation */}
      {/* TODO: Scrollable card innards on very short screens */}
      {selectedArcade && (
        <div
          className={
            "fixed short:bottom-12 tall:bottom-20 left-2 right-2 sm:right-auto " +
            "pl-inset-left pr-inset-right pt-inset-top pb-inset-bottom"
          }
        >
          {/* Prevent pinch-zoom in the pop-up, since if dismissed, there's no way to zoom back out */}
          <div className="bg-base-200 p-4 rounded-2xl shadow-2xl touch-pan-x touch-pan-y">
            <h2 class="text-xl font-semibold">
              {selectedArcade.properties.name}
            </h2>
            <LocationDetails location={selectedArcade} />
          </div>
        </div>
      )}
      {searchSettings}
    </>
  );
};

export default ExplorePage;

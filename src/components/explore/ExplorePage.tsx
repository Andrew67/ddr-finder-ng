/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useMemo, useState } from "preact/hooks";

import { FilterSourceButtons } from "./FilterSourceButtons";
import { SearchSettings } from "../SearchSettings";
import { useStore } from "@nanostores/preact";
import { $selectedArcadeWithDistance } from "../../stores/explore/selectedArcade.ts";
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
      {/* Bottom right controls */}
      <div
        className={
          "fixed short:top-16 short:pt-inset-top short:left-2 short:pl-inset-left " +
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
            "fixed short:bottom-20 tall:bottom-28 left-2 right-2 sm:right-auto " +
            "pl-inset-left pr-inset-right pt-inset-top pb-inset-bottom"
          }
        >
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body p-5">
              <h2 class="card-title">{selectedArcade.properties.name}</h2>
              <LocationDetails location={selectedArcade} />
            </div>
          </div>
        </div>
      )}
      {searchSettings}
    </>
  );
};

export default ExplorePage;

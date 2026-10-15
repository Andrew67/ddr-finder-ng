/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, Fragment, FunctionComponent } from "preact";
import { useMemo, useRef, useState } from "preact/hooks";
import clsx from "clsx";

import { FilterSourceButtons } from "../FilterSourceButtons";
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

  /**
   * Holds onto the last selected arcade so the details card
   * can fade out with the proper content when `selectedArcade` goes `null`.
   */
  const lastSelectedArcade = useRef(selectedArcade);
  if (selectedArcade) lastSelectedArcade.current = selectedArcade;

  return (
    <>
      {/* Bottom right controls, which become bottom left on short screens */}
      <div
        className={clsx(
          "fixed pt-inset-top left-2 tall:left-auto pl-inset-left",
          "right-auto tall:right-2 pr-inset-right bottom-28 pb-inset-bottom",
          "flex flex-col gap-2",
        )}
      >
        <FilterSourceButtons
          collapseOnSmallScreens={true}
          filterClick={() => setSearchSettingsOpen(true)}
          sourceClick={() => setSearchSettingsOpen(true)}
        />
      </div>
      {/* Selected location details card */}
      {lastSelectedArcade.current && (
        <div
          className={clsx(
            "fixed z-20 bottom-2 tall:bottom-20 left-2 right-2 sm:right-1/2 @container",
            "pl-inset-left pr-inset-right sm:pr-0 pt-inset-top pb-inset-bottom",
            "transition transition-discrete",
            !selectedArcade && "hidden opacity-0",
            selectedArcade && "block opacity-100 starting:opacity-0",
          )}
        >
          {/* Prevent pinch-zoom in the pop-up, since if dismissed, there's no way to zoom back out */}
          <div className="bg-base-200 p-4 rounded-box shadow-2xl touch-pan-x touch-pan-y">
            <h2 class="text-xl font-semibold">
              {lastSelectedArcade.current.properties.name}
            </h2>
            <LocationDetails location={lastSelectedArcade.current} />
          </div>
        </div>
      )}
      {searchSettings}
    </>
  );
};

export default ExplorePage;

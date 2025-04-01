/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useMemo, useState } from "preact/hooks";

import { FilterSourceButtons } from "./FilterSourceButtons";
import { SearchSettings } from "../SearchSettings";

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
      {searchSettings}
    </>
  );
};

export default ExplorePage;

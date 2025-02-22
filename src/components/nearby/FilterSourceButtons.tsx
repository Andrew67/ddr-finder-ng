/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { $activeSource } from "../../stores/sources.ts";
import { useStore } from "@nanostores/preact";
import { IconDeviceGamepad, IconListSearch } from "@tabler/icons-preact";

export const FilterSourceButtons: FunctionComponent = () => {
  const activeSource = useStore($activeSource);
  const sourceName = activeSource ? `: ${activeSource.name}` : "";

  return (
    <>
      <button type="button" className="btn btn-primary">
        <IconDeviceGamepad aria-hidden="true" /> Filter: Any Games
      </button>
      <button type="button" className="btn btn-accent">
        <IconListSearch aria-hidden="true" /> Source{sourceName}
      </button>
    </>
  );
};

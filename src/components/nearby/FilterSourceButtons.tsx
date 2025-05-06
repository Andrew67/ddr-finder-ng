/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useStore } from "@nanostores/preact";
import { IconDeviceGamepad, IconListSearch } from "@tabler/icons-preact";

import { $activeSource } from "@/stores/sources";
import { $gameFilter } from "@/stores/gameFilter";

type FilterSourceButtonsProps = {
  filterClick: () => void;
  sourceClick: () => void;
};

export const FilterSourceButtons: FunctionComponent<
  FilterSourceButtonsProps
> = (props: FilterSourceButtonsProps) => {
  const { filterClick, sourceClick } = props;

  const activeSource = useStore($activeSource);
  const sourceName = activeSource ? `: ${activeSource.name}` : "";

  const gameFilter = useStore($gameFilter);
  const gameFilterString =
    gameFilter.length === 0
      ? "Any Games"
      : gameFilter.join(", ").toLocaleUpperCase("en-US");

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={filterClick}>
        <IconDeviceGamepad aria-hidden="true" /> Filter: {gameFilterString}
      </button>
      <button type="button" className="btn btn-accent" onClick={sourceClick}>
        <IconListSearch aria-hidden="true" /> Source{sourceName}
      </button>
    </>
  );
};

/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { $activeSource } from "../../stores/sources.ts";
import { useStore } from "@nanostores/preact";
import { IconDeviceGamepad, IconListSearch } from "@tabler/icons-preact";
import { $gameFilter } from "../../stores/gameFilter.ts";

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
      {/* Simulate `btn-square` for small screens but expand at `tall+sm` */}
      <button
        type="button"
        className="mt-2 btn min-w-12 px-0 tall:sm:px-4 btn-primary"
        onClick={filterClick}
      >
        <IconDeviceGamepad aria-hidden="true" />
        <span className="hidden tall:sm:inline">
          Filter: {gameFilterString}
        </span>
      </button>
      <button
        type="button"
        className="btn min-w-12 px-0 tall:sm:px-4 btn-accent"
        onClick={sourceClick}
      >
        <IconListSearch aria-hidden="true" />
        <span className="hidden tall:sm:inline">Source{sourceName}</span>
      </button>
    </>
  );
};

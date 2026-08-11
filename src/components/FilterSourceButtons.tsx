/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, Fragment, FunctionComponent } from "preact";
import { useStore } from "@nanostores/preact";
import { IconDeviceGamepad, IconListSearch } from "@tabler/icons-preact";

import { i18n } from "@/stores/i18n.ts";
import { $activeSource } from "@/stores/sources.ts";
import { $gameFilter } from "@/stores/gameFilter.ts";

export const messages = i18n("filterSourceButtons", {
  filter: "Filter: ",
  filterJoiner: ", ",
  source: "Source",
  sourceJoiner: ": ",
  anyGames: "Any Games",
});

type FilterSourceButtonsProps = {
  collapseOnSmallScreens?: boolean;
  filterClick: () => void;
  sourceClick: () => void;
};

export const FilterSourceButtons: FunctionComponent<
  FilterSourceButtonsProps
> = (props: FilterSourceButtonsProps) => {
  const t = useStore(messages);
  const { collapseOnSmallScreens, filterClick, sourceClick } = props;

  /** Simulate `btn-square` for small screens but expand at `tall+sm` */
  const btnCollapseClasses = collapseOnSmallScreens
    ? "min-w-12 px-0 tall:sm:px-4"
    : "";
  /** Simulate text for small screens but show at `tall+sm` */
  const textCollapseClasses = collapseOnSmallScreens
    ? "hidden tall:sm:inline"
    : "";

  const activeSource = useStore($activeSource);
  const sourceName = activeSource
    ? `${t.sourceJoiner}${activeSource.name}`
    : "";

  const gameFilter = useStore($gameFilter);
  const gameFilterString =
    gameFilter.length === 0
      ? t.anyGames
      : gameFilter
          .map((v) => v.toLocaleUpperCase("en-US"))
          .join(t.filterJoiner);

  return (
    <>
      <button
        type="button"
        className={`${btnCollapseClasses} btn btn-primary`}
        onClick={filterClick}
        aria-label={`${t.filter}${gameFilterString}`}
      >
        <IconDeviceGamepad aria-hidden="true" />
        <span className={textCollapseClasses} aria-hidden="true">
          {t.filter}
          {gameFilterString}
        </span>
      </button>
      <button
        type="button"
        className={`${btnCollapseClasses} btn btn-accent`}
        onClick={sourceClick}
        aria-label={`${t.source}${sourceName}`}
      >
        <IconListSearch aria-hidden="true" />
        <span className={textCollapseClasses} aria-hidden="true">
          {t.source}
          {sourceName}
        </span>
      </button>
    </>
  );
};

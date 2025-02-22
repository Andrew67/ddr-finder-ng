/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { $activeSource } from "../../stores/sources.ts";
import { useStore } from "@nanostores/preact";
import { IconDeviceGamepad, IconListSearch } from "@tabler/icons-preact";

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

  return (
    <>
      <button type="button" class="btn btn-primary" onClick={filterClick}>
        <IconDeviceGamepad aria-hidden="true" /> Filter: Any Games
      </button>
      <button type="button" class="btn btn-accent" onClick={sourceClick}>
        <IconListSearch aria-hidden="true" /> Source{sourceName}
      </button>
    </>
  );
};

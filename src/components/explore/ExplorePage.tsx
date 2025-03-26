/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { IconDeviceGamepad, IconListSearch } from "@tabler/icons-preact";

export const ExplorePage: FunctionComponent = () => {
  return (
    <div
      className={
        "fixed short:top-16 short:pt-inset-top short:left-2 short:pl-inset-left " +
        "tall:right-2 tall:pr-inset-right tall:bottom-28 tall:sm:bottom-24 tall:pb-inset-bottom " +
        "flex flex-col gap-2"
      }
    >
      {/* Simulate `btn-square` for small screens but expand at `sm` */}
      <button
        type="button"
        className="mt-2 btn min-w-12 px-0 sm:px-4 btn-primary"
      >
        <IconDeviceGamepad aria-hidden="true" />
        <span className="hidden sm:inline">Filter</span>
      </button>
      <button type="button" className="btn min-w-12 px-0 sm:px-4 btn-accent">
        <IconListSearch aria-hidden="true" />
        <span className="hidden sm:inline">Source</span>
      </button>
    </div>
  );
};

export default ExplorePage;

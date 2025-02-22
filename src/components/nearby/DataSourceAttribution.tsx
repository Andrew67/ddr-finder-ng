/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { $activeSource } from "../../stores/sources.ts";
import { useStore } from "@nanostores/preact";

export const DataSourceAttribution: FunctionComponent = () => {
  const activeSource = useStore($activeSource);
  if (!activeSource) return <></>;

  return (
    <>
      &copy;{" "}
      <a
        href={activeSource["url:homepage"]}
        target="_blank"
        className="link link-info"
      >
        {activeSource.name}
      </a>{" "}
      Contributors
    </>
  );
};

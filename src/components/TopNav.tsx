/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useEffect, useState } from "preact/hooks";
import { IconCalculator } from "@tabler/icons-preact";
import { IconPlatformShare } from "./IconPlatformShare.tsx";

const share = () =>
  navigator.share({ title: document.title, url: window.location.href });

export const TopNav: FunctionComponent = () => {
  const [showShareButton, setShowShareButton] = useState(false);
  useEffect(() => {
    if ("share" in navigator) setShowShareButton(true);
  }, []);

  return (
    <div className="navbar sticky z-10 top-0 bg-base-300">
      <div className="flex-1 pl-inset-left pt-inset-top">
        <h1 className="btn btn-ghost text-xl">DDR Finder</h1>
      </div>
      <div className="flex-none pr-inset-right pt-inset-top print:hidden">
        <a
          href="https://ddrcalc.andrew67.com/?df=1"
          target="_blank"
          title="Calculator"
          className="btn btn-square btn-ghost"
        >
          <IconCalculator aria-hidden="true" />
        </a>
        {showShareButton && (
          <button
            type="button"
            title="Share"
            className="btn btn-square btn-ghost"
            onClick={share}
          >
            <IconPlatformShare aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

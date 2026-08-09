/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { IconCalculator } from "@tabler/icons-preact";

import { i18n } from "@/stores/i18n.ts";

import { IconPlatformShare } from "./IconPlatformShare.tsx";

export const messages = i18n("topNav", {
  appName: "DDR Finder",
  calculator: "Calculator",
  share: "Share",
});

const share = () =>
  navigator.share({ title: document.title, url: window.location.href });

export const TopNav: FunctionComponent = () => {
  const t = useStore(messages);
  const [showShareButton, setShowShareButton] = useState(false);
  useEffect(() => {
    if ("share" in navigator) setShowShareButton(true);
  }, []);

  return (
    <div className="navbar fixed z-10 top-0 bg-base-300">
      <div className="flex-1 pl-inset-left pt-inset-top">
        <h1 className="btn btn-ghost text-xl">{t.appName}</h1>
      </div>
      <div className="flex-none pr-inset-right pt-inset-top print:hidden">
        <a
          href="https://ddrcalc.andrew67.com/?df=1"
          target="_blank"
          title={t.calculator}
          className="btn btn-square btn-ghost"
        >
          <IconCalculator aria-hidden="true" />
        </a>
        {showShareButton && (
          <button
            type="button"
            title={t.share}
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

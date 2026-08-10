/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { IconCalculator, IconLanguage } from "@tabler/icons-preact";

import { setting as localeSetting, i18n, type Locale } from "@/stores/i18n.ts";

import { IconPlatformShare } from "./IconPlatformShare.tsx";
import { useRef } from "preact/compat";

export const messages = i18n("topNav", {
  appName: "DDR Finder",
  changeLanguage: "Change Language",
  calculator: "Speed Calculator",
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

  const languageMenuRef = useRef<HTMLDetailsElement>(null);
  const setLanguage = useCallback((locale: Locale) => {
    localeSetting.set(locale);
    languageMenuRef.current!.open = false;
  }, []);

  return (
    <div className="navbar fixed z-10 top-0 bg-base-300">
      <div className="flex-1 pl-inset-left pt-inset-top">
        <h1 className="btn btn-ghost text-xl">{t.appName}</h1>
      </div>
      <div className="flex-none pr-inset-right pt-inset-top print:hidden">
        <ul class="menu menu-horizontal py-0 px-1">
          <li>
            <details ref={languageMenuRef}>
              <summary className="translate-y-0.5">
                <IconLanguage aria-hidden="true" />
                <span className="sr-only">{t.changeLanguage}</span>
              </summary>
              <ul class="bg-base-100 rounded-t-none p-2">
                <li>
                  <button lang="en" onClick={() => setLanguage("en")}>
                    English
                  </button>
                </li>
                <li>
                  <button lang="es" onClick={() => setLanguage("es")}>
                    Español
                  </button>
                </li>
                <li>
                  <button lang="ja" onClick={() => setLanguage("ja")}>
                    日本語
                  </button>
                </li>
                <li>
                  <button lang="zh" onClick={() => setLanguage("zh")}>
                    中文
                  </button>
                </li>
              </ul>
            </details>
          </li>
          <li>
            <a
              href="https://ddrcalc.andrew67.com/?df=1"
              target="_blank"
              title={t.calculator}
              className="btn btn-square btn-ghost"
            >
              <IconCalculator aria-hidden="true" />
            </a>
          </li>
          {showShareButton && (
            <li>
              <button
                type="button"
                title={t.share}
                className="btn btn-square btn-ghost"
                onClick={share}
              >
                <IconPlatformShare aria-hidden="true" />
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

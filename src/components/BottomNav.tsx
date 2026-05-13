/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useCallback } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { getPagePath } from "@nanostores/router";
import { IconLocationSearch, IconMap2, IconMenu2 } from "@tabler/icons-preact";

import { $router } from "@/stores/router";

export const BottomNav: FunctionComponent<{
  initialPage: string | undefined;
}> = ({ initialPage = "" }) => {
  const page = useStore($router);
  const pageRoute = page?.route ?? initialPage;

  const isActiveLink = useCallback(
    (page: string) => page === pageRoute,
    [pageRoute],
  );
  const linkClasses = useCallback(
    (page: string) => (isActiveLink(page) ? "dock-active" : ""),
    [isActiveLink],
  );

  return (
    <nav
      className="dock dock-m3 z-10 short:dock-xs print:hidden bg-base-300 pl-inset-left pr-inset-right"
      style="--radius-icon: 1rem; --radius-item: 1.25rem;"
    >
      <div className="hidden sm:block" />
      <a
        href={getPagePath($router, "nearby")}
        className={linkClasses("nearby")}
      >
        <span className="dock-icon">
          <IconLocationSearch aria-hidden="true" />
        </span>
        <span className="dock-label">Nearby</span>
      </a>
      <a
        href={getPagePath($router, "explore")}
        className={linkClasses("explore")}
      >
        <span className="dock-icon">
          <IconMap2 aria-hidden="true" />
        </span>
        <span className="dock-label">Explore</span>
      </a>
      <a href={getPagePath($router, "menu")} className={linkClasses("menu")}>
        <span className="dock-icon">
          <IconMenu2 aria-hidden="true" />
        </span>
        <span className="dock-label">Menu</span>
      </a>
      <div className="hidden sm:block" />
    </nav>
  );
};

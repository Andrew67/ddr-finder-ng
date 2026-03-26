/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useCallback } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { getPagePath } from "@nanostores/router";
import { IconLocationSearch, IconMap2, IconMenu2 } from "@tabler/icons-preact";

import { $router } from "@/stores/router";

/**
 * Bottom navigation which implements M3 Expressive,
 * including horizontal labels on short-height screens and medium-width screens.
 * @see https://m3.material.io/components/navigation-bar/specs
 */
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
    (page: string) =>
      `${isActiveLink(page) ? "short-or-md:bg-base-200" : ""} short-or-md:flex-row short-or-md:h-10 short-or-md:gap-2 rounded-2xl`,
    [isActiveLink],
  );
  const iconClasses = useCallback(
    (page: string) =>
      `${isActiveLink(page) ? "bg-base-200" : ""} tall:w-14 short-or-md:w-auto h-8 grid place-items-center rounded-2xl`,
    [isActiveLink],
  );

  return (
    <nav className="dock z-10 short:dock-xs print:hidden bg-base-300 pl-inset-left pr-inset-right">
      <div className="hidden sm:block" />
      <a
        href={getPagePath($router, "nearby")}
        className={linkClasses("nearby")}
      >
        <div className={iconClasses("nearby")}>
          <IconLocationSearch aria-hidden="true" class="size-5" />
        </div>
        <span className="dock-label">Nearby</span>
      </a>
      <a
        href={getPagePath($router, "explore")}
        className={linkClasses("explore")}
      >
        <div className={iconClasses("explore")}>
          <IconMap2 aria-hidden="true" class="size-5" />
        </div>
        <span className="dock-label">Explore</span>
      </a>
      <a href={getPagePath($router, "menu")} className={linkClasses("menu")}>
        <div className={iconClasses("menu")}>
          <IconMenu2 aria-hidden="true" class="size-5" />
        </div>
        <span className="dock-label">Menu</span>
      </a>
      <div className="hidden sm:block" />
    </nav>
  );
};

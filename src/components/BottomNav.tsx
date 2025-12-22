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

  const activeLinkClasses = useCallback(
    (page: string) => (page === pageRoute ? "dock-active bg-base-200" : ""),
    [pageRoute],
  );

  return (
    <>
      <nav className="dock z-10 short:dock-xs print:hidden bg-base-300 pl-inset-left pr-inset-right pb-0 bottom-inset-bottom">
        <a
          href={getPagePath($router, "nearby")}
          className={`${activeLinkClasses("nearby")} tall:max-w-24 short:flex-row short:gap-2`}
        >
          <IconLocationSearch aria-hidden="true" class="size-[1.2em]" />
          <span className="dock-label">Nearby</span>
        </a>
        <a
          href={getPagePath($router, "explore")}
          className={`${activeLinkClasses("explore")} tall:max-w-24 short:flex-row short:gap-2`}
        >
          <IconMap2 aria-hidden="true" class="size-[1.2em]" />
          <span className="dock-label">Explore</span>
        </a>
        <a
          href={getPagePath($router, "menu")}
          className={`${activeLinkClasses("menu")} tall:max-w-24 short:flex-row short:gap-2`}
        >
          <IconMenu2 aria-hidden="true" class="size-[1.2em]" />
          <span className="dock-label">Menu</span>
        </a>
      </nav>
      {/* This hack won't be needed in DaisyUI 5.x */}
      <div className="fixed bottom-0 w-full h-inset-bottom z-10 bg-base-300"></div>
    </>
  );
};

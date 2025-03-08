import type { h, FunctionComponent } from "preact";
import { useCallback } from "preact/hooks";
import { IconLocationSearch, IconMap2, IconMenu2 } from "@tabler/icons-preact";
import { $router } from "../stores/router.ts";
import { useStore } from "@nanostores/preact";
import { getPagePath } from "@nanostores/router";

export const BottomNav: FunctionComponent<{
  initialPage: string | undefined;
}> = ({ initialPage = "" }) => {
  const pageRoute = useStore($router)?.route ?? initialPage;

  const activeLinkClasses = useCallback(
    (page: string) => (page === pageRoute ? "active bg-base-200" : ""),
    [pageRoute],
  );

  return (
    <>
      <nav className="btm-nav z-10 short:btm-nav-xs bg-base-300 pl-inset-left pr-inset-right pb-0 bottom-inset-bottom">
        <a
          href={getPagePath($router, "nearby")}
          className={activeLinkClasses("nearby") + " short:flex-row"}
        >
          <IconLocationSearch aria-hidden="true" />
          <span className="btm-nav-label">Nearby</span>
        </a>
        <a
          href={getPagePath($router, "explore")}
          className={activeLinkClasses("explore") + " short:flex-row"}
        >
          <IconMap2 aria-hidden="true" />
          <span className="btm-nav-label">Explore</span>
        </a>
        <a
          href={getPagePath($router, "menu")}
          className={activeLinkClasses("menu") + " short:flex-row"}
        >
          <IconMenu2 aria-hidden="true" />
          <span className="btm-nav-label">Menu</span>
        </a>
      </nav>
      {/* This hack won't be needed in DaisyUI 5.x */}
      <div className="fixed bottom-0 w-full h-inset-bottom z-10 bg-base-300"></div>
    </>
  );
};

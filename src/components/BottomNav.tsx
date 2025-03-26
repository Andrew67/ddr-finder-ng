import type { h, FunctionComponent } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { IconLocationSearch, IconMap2, IconMenu2 } from "@tabler/icons-preact";
import { $router } from "../stores/router.ts";
import { useStore } from "@nanostores/preact";
import { getPagePath } from "@nanostores/router";
import { $userLocation } from "../stores/userLocation.ts";

export const BottomNav: FunctionComponent<{
  initialPage: string | undefined;
}> = ({ initialPage = "" }) => {
  const page = useStore($router);
  const pageRoute = page?.route ?? initialPage;

  const activeLinkClasses = useCallback(
    (page: string) => (page === pageRoute ? "active bg-base-200" : ""),
    [pageRoute],
  );

  // Future: getPagePath($router, "explore", {}, page?.search)
  // Today: compatibility open of existing /ng UI
  const userLocation = useStore($userLocation);
  const [ngLink, setNgLink] = useState("/ng");
  useEffect(() => {
    if (!userLocation) return setNgLink("/ng");
    const ngParams = new URLSearchParams();
    ngParams.set("ll", `${userLocation.latitude},${userLocation.longitude}`);
    ngParams.set("z", "14");
    return setNgLink(`/ng?${ngParams}`);
  }, [userLocation]);

  return (
    <>
      <nav className="btm-nav z-10 short:btm-nav-xs print:hidden bg-base-300 pl-inset-left pr-inset-right pb-0 bottom-inset-bottom">
        <a
          href={getPagePath($router, "nearby")}
          className={`${activeLinkClasses("nearby")} short:flex-row`}
        >
          <IconLocationSearch aria-hidden="true" />
          <span className="btm-nav-label">Nearby</span>
        </a>
        <a
          href={ngLink}
          target="_self"
          className={`${activeLinkClasses("explore")} short:flex-row`}
        >
          <IconMap2 aria-hidden="true" />
          <span className="btm-nav-label">Explore</span>
        </a>
        <a
          href={getPagePath($router, "menu")}
          className={`${activeLinkClasses("menu")} short:flex-row`}
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

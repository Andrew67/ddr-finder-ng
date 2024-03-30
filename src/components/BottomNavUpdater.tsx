import type { h, FunctionComponent } from "preact";
import { useRouter } from "preact-router";
import { useEffect } from "preact/hooks";

/**
 * Updates the static bottom nav buttons to the active route dynamically.
 */
export const BottomNavUpdater: FunctionComponent = () => {
  const routerPath = useRouter()[0].path;

  useEffect(() => {
    // First render is `undefined` and initial page doesn't call this block
    if (routerPath) {
      const bottomLinks =
        document.querySelectorAll<HTMLAnchorElement>(".btm-nav > a[href]");
      bottomLinks.forEach((link) => {
        const isLinkActive = link.getAttribute("href") === routerPath;
        link.className = isLinkActive ? "active bg-base-200" : "";
        link.setAttribute("aria-current", isLinkActive ? "true" : "false");
      });
    }
  }, [routerPath]);

  return <></>;
};

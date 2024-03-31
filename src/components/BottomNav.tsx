import type { h, FunctionComponent } from "preact";
import { route, useRouter } from "preact-router";
import { useCallback } from "preact/hooks";
import { IconLocationSearch, IconMap2, IconMenu2 } from "@tabler/icons-preact";

export const BottomNav: FunctionComponent<{
  initialPage: string | undefined;
}> = ({ initialPage = "" }) => {
  const routerPath = useRouter()[0].path;
  // First render is `undefined`
  const activePage = routerPath ?? `/app/${initialPage}/`;

  const activeLinkClasses = useCallback(
    (page: string) =>
      `/app/${page}/` === activePage ? "active bg-base-200" : "",
    [activePage],
  );

  const routeReplace = useCallback((page: string) => {
    return (e: Event) => {
      e.preventDefault();
      route(`/app/${page}/`, true);
    };
  }, []);

  return (
    <nav className="btm-nav short:btm-nav-xs bg-base-300">
      <a
        href="/app/nearby/"
        data-native=""
        onClick={routeReplace("nearby")}
        class={activeLinkClasses("nearby") + " short:flex-row"}
      >
        <IconLocationSearch aria-hidden="true" />
        <span className="btm-nav-label">Nearby</span>
      </a>
      <a
        href="/app/explore/"
        data-native=""
        onClick={routeReplace("explore")}
        class={activeLinkClasses("explore") + " short:flex-row"}
      >
        <IconMap2 aria-hidden="true" />
        <span class="btm-nav-label">Explore</span>
      </a>
      <a
        href="/app/menu/"
        data-native=""
        onClick={routeReplace("menu")}
        class={activeLinkClasses("menu") + " short:flex-row"}
      >
        <IconMenu2 aria-hidden="true" />
        <span class="btm-nav-label">Menu</span>
      </a>
    </nav>
  );
};

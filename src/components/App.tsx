/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useState } from "preact/hooks";
import { lazy, Suspense } from "preact/compat";
import { useStore } from "@nanostores/preact";

import { $router } from "@/stores/router";

import { HeadMetaUpdater } from "./HeadMetaUpdater";

const HomeRedirect = lazy(() => import("./HomeRedirect"));
const NearbyPage = lazy(() => import("./nearby/NearbyPage"));
const MenuPage = lazy(() => import("./menu/MenuPage"));

const ExplorePage = lazy(() => import("./explore/ExplorePage"));
const MapView = lazy(() => import("./explore/MapView"));

export const App: FunctionComponent = () => {
  const page = useStore($router);
  const [hasExploreBeenVisited, setHasExploreBeenVisited] = useState(false);

  // TODO: 404 page / `undefined` page case
  let childPage = <HomeRedirect />;
  if (page?.route === "nearby") childPage = <NearbyPage />;
  else if (page?.route === "explore") {
    setHasExploreBeenVisited(true);
    childPage = <ExplorePage />;
  } else if (page?.route === "menu") childPage = <MenuPage />;

  return (
    <>
      <HeadMetaUpdater />
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        {hasExploreBeenVisited && <MapView />}
        {childPage}
      </Suspense>
    </>
  );
};

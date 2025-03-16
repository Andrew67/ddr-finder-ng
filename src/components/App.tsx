/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { lazy, Suspense } from "preact/compat";
import { useStore } from "@nanostores/preact";

import { $router } from "../stores/router";

import { HeadMetaUpdater } from "./HeadMetaUpdater";

const HomeRedirect = lazy(() => import("./HomeRedirect"));
const NearbyPage = lazy(() => import("./nearby/NearbyPage"));
const MenuPage = lazy(() => import("./menu/MenuPage"));

export const App: FunctionComponent = () => {
  const page = useStore($router);

  // TODO: 404 page / `undefined` page case
  let childPage = <HomeRedirect />;
  if (page?.route === "nearby") childPage = <NearbyPage />;
  else if (page?.route === "explore")
    childPage = (
      <div>
        {new Array(100).fill(0).map((_, i) => (
          <li>Explore {i + 1}</li>
        ))}
      </div>
    );
  else if (page?.route === "menu") childPage = <MenuPage />;

  return (
    <>
      <HeadMetaUpdater />
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        {childPage}
      </Suspense>
    </>
  );
};

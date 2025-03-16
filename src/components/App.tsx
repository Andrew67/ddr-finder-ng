/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useStore } from "@nanostores/preact";

import { $router } from "../stores/router.js";

import { HomeRedirect } from "./HomeRedirect.tsx";
import { HeadMetaUpdater } from "./HeadMetaUpdater.tsx";
import { NearbyPage } from "./nearby/NearbyPage.tsx";
import { MenuPage } from "./menu/MenuPage.tsx";

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
      {childPage}
    </>
  );
};

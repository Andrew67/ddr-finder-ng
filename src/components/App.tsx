import type { h, FunctionComponent } from "preact";
import Router from "preact-router";
import { HeadMetaUpdater } from "./HeadMetaUpdater.tsx";
import { NearbyPage } from "./nearby/NearbyPage.tsx";
import { HomeRedirect } from "./HomeRedirect.tsx";

export const App: FunctionComponent = () => (
  <>
    <HeadMetaUpdater />
    <Router>
      <HomeRedirect path="/app/" />
      <NearbyPage path="/app/nearby/" />
      <div path="/app/explore/">
        {new Array(100).fill(0).map((_, i) => (
          <li>Explore {i + 1}</li>
        ))}
      </div>
      <div path="/app/menu/">
        {new Array(100).fill(0).map((_, i) => (
          <li>Menu {i + 1}</li>
        ))}
      </div>
    </Router>
  </>
);

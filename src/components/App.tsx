import type { h, FunctionComponent } from "preact";
import Router from "preact-router";
import { BottomNavUpdater } from "./BottomNavUpdater.tsx";
import { HeadMetaUpdater } from "./HeadMetaUpdater.tsx";

export const App: FunctionComponent = () => (
  <>
    <HeadMetaUpdater />
    <BottomNavUpdater />
    <Router>
      <div path="/app/">Make a selection below!</div>
      <div path="/app/nearby/">
        {new Array(100).fill(0).map((_, i) => (
          <li>Nearby {i + 1}</li>
        ))}
      </div>
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

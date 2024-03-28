import type { h, FunctionComponent } from "preact";
import Router from "preact-router";

export const App: FunctionComponent = () => (
  <Router>
    <div path="/app/">Make a selection below!</div>
    <div path="/app/nearby/">
      <iframe
        title="Embedded Nearby Page"
        class="w-full h-svh"
        src="/locator/?embed=true"
      ></iframe>
    </div>
    <div path="/app/explore/" class="h-svh pb-32">
      <iframe
        title="Embedded Explore Page"
        class="w-full h-full"
        src="/ng/?embed=true"
      ></iframe>
    </div>
    <div path="/app/menu/">
      <iframe
        title="Embedded Menu Page"
        className="w-full h-svh"
        src="/android/about/?n=3.99-web"
      ></iframe>
    </div>
  </Router>
);

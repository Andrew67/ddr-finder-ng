/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useEffect } from "preact/hooks";
import { redirectPage } from "@nanostores/router";

import { $lastUsedExperience, $router } from "../stores/router";

export const HomeRedirect: FunctionComponent = () => {
  useEffect(() => {
    redirectPage($router, $lastUsedExperience.get());
  }, []);
  // Return at least one element, in order to clear the "Loading..." message
  return <div></div>;
};

export default HomeRedirect;

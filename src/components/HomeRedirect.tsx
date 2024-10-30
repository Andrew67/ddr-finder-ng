import type { FunctionComponent } from "preact";
import { useEffect } from "preact/hooks";
import { redirectPage } from "@nanostores/router";
import { $router } from "../stores/router";

export const HomeRedirect: FunctionComponent = () => {
  useEffect(() => {
    // TODO: Redirect to last-used page
    redirectPage($router, "nearby");
  }, []);
  return null;
};

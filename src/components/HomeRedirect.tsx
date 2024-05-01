import type { FunctionComponent } from "preact";
import { useEffect } from "preact/hooks";
import { route } from "preact-router";

export const HomeRedirect: FunctionComponent = () => {
  useEffect(() => {
    // TODO: Redirect to last-used page
    route("/app/nearby/", true);
  }, []);
  return null;
};

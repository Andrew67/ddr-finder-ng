import type { h, FunctionComponent } from "preact";
import { useRouter } from "preact-router";
import { useEffect, useMemo } from "preact/hooks";
import { pages } from "./pages.ts";

/**
 * Updates the document title, meta description etc. to the active route dynamically.
 */
export const HeadMetaUpdater: FunctionComponent = () => {
  const routerPath = useRouter()[0].path;
  const activePage = useMemo(
    () => pages.find((page) => routerPath === `/app/${page.page}/`),
    [routerPath],
  );

  useEffect(() => {
    if (activePage) {
      document.title = activePage.title;
      const metaDescription = document.querySelector<HTMLMetaElement>(
        "meta[name=description]",
      );
      if (metaDescription) metaDescription.content = activePage.description;
    }
  }, [activePage]);

  return <></>;
};

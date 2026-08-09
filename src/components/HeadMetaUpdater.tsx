import type { Fragment, FunctionComponent } from "preact";
import { useEffect } from "preact/hooks";
import { useStore } from "@nanostores/preact";

import { $metadata } from "@/stores/router";
import { $locale } from "@/stores/i18n";

/**
 * Updates the document title, meta description etc. to the active route dynamically.
 */
export const HeadMetaUpdater: FunctionComponent = () => {
  const metadata = useStore($metadata);
  const locale = useStore($locale);

  useEffect(() => {
    if (metadata) {
      document.title = metadata.title;
      const metaDescription = document.querySelector<HTMLMetaElement>(
        "meta[name=description]",
      );
      if (metaDescription) metaDescription.content = metadata.description;
    }
    if (locale) {
      document.documentElement.lang = locale;
    }
  }, [metadata]);

  return <></>;
};

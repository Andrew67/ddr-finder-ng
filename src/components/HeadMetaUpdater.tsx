import type { FunctionComponent } from "preact";
import { useEffect } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { $metadata } from "@/stores/router";

/**
 * Updates the document title, meta description etc. to the active route dynamically.
 */
export const HeadMetaUpdater: FunctionComponent = () => {
  const metadata = useStore($metadata);

  useEffect(() => {
    if (metadata) {
      document.title = metadata.title;
      const metaDescription = document.querySelector<HTMLMetaElement>(
        "meta[name=description]",
      );
      if (metaDescription) metaDescription.content = metadata.description;
    }
  }, [metadata]);

  return <></>;
};

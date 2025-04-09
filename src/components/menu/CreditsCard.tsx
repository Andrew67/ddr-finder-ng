/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useMemo } from "preact/hooks";
import { useStore } from "@nanostores/preact";

import { $sources } from "../../stores/sources";

export const CreditsCard: FunctionComponent = () => {
  const sources = useStore($sources);
  const sourceList = useMemo(() => {
    if (!sources.data) return <></>;
    return Object.values(sources.data.sources).map((source) => (
      <li>
        <a
          href={source["url:homepage"]}
          target="_blank"
          className="link link-info"
        >
          {source.name}
        </a>
      </li>
    ));
  }, [sources.data]);

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Credits</h2>

        {sources.data && (
          <>
            <h3 className="text-lg">Data Sources</h3>
            <ul className="list-disc pl-6">{sourceList}</ul>
          </>
        )}

        <h3 className="text-lg">Open Source</h3>
        <ul className="list-disc pl-6">
          <li>
            Using{" "}
            <a
              href="https://daisyui.com/"
              target="_blank"
              class="link link-info"
            >
              daisyUI
            </a>{" "}
            and{" "}
            <a
              href="https://tailwindcss.com/"
              target="_blank"
              class="link link-info"
            >
              Tailwind CSS
            </a>{" "}
            for page styling.
          </li>
          <li>
            Built with{" "}
            <a
              href="https://astro.build/"
              target="_blank"
              class="link link-info"
            >
              Astro
            </a>
            .
          </li>
          <li>
            Arrow icon from the{" "}
            <a
              href="https://www.stepmania.com/"
              target="_blank"
              className="link link-info"
            >
              StepMania 5
            </a>{" "}
            default noteskin.
          </li>
          <li>
            <a
              href="https://thenounproject.com/icon/25579/"
              target="_blank"
              className="link link-info"
            >
              "Map Marker"
            </a>{" "}
            icon by meghan hade from the Noun Project.
          </li>
          <li>
            Other icons from{" "}
            <a
              href="https://tabler.io/icons"
              target="_blank"
              className="link link-info"
            >
              Tabler Icons
            </a>
            .
          </li>
        </ul>
      </div>
    </div>
  );
};

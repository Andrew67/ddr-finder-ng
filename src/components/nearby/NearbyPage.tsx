import { IconCurrentLocation } from "@tabler/icons-preact";
import type { h, FunctionComponent } from "preact";

export const NearbyPage: FunctionComponent = () => {
  return (
    <>
      <h2 class="text-2xl mt-4 mx-4">Your location:</h2>
      {/* Add border border-primary when result is in */}
      <div class="h-52 bg-base-200"></div>
      <div class="mx-4 mb-4">
        <p class="h-6">Accuracy: approximately 80 meters</p>
        <p class="mb-4">
          <button type="button" class="btn btn-secondary">
            <IconCurrentLocation aria-hidden="true" /> New Search
          </button>
        </p>

        <h2 class="text-2xl">Nearby arcades:</h2>
        <p class="h-6 mb-2">&copy; OpenStreetMap Contributors</p>
        <ul>
          {new Array(5).fill(0).map((_, i) => (
            // Add collapse-plus when result is in
            <li class="collapse bg-base-200 mb-2 print:collapse-open print:border print:rounded">
              <input type="checkbox" name={`arcade-accordion-${i}`} />
              <div class="collapse-title text-lg sm:text-xl font-medium"></div>
              {/*<div class="collapse-content"></div>*/}
            </li>
          ))}
        </ul>

        <footer class="mt-6">
          <p class="mb-2">
            &copy; 2012&ndash;2024{" "}
            <a
              href="https://andrew67.com/"
              target="_blank"
              class="link link-info"
            >
              Andrés Cordero
            </a>
          </p>
          <p class="text-sm">
            No warranty is made regarding operation, and no accuracy or
            freshness of results is guaranteed.
            <br />
            Arrow icon from the{" "}
            <a
              href="https://www.stepmania.com/"
              target="_blank"
              class="link link-info"
            >
              StepMania 5
            </a>{" "}
            default noteskin.
            <br />
          </p>
        </footer>
      </div>
    </>
  );
};

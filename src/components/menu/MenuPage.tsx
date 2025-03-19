/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useStore } from "@nanostores/preact";
import { $isMac } from "../../stores/platform.ts";

import { CreditsCard } from "./CreditsCard";
import { AboutCard } from "./AboutCard.tsx";

export const MenuPage: FunctionComponent = () => {
  const isMac = useStore($isMac);

  return (
    <div className="p-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {isMac && (
        <div className="stats sm:stats-vertical bg-base-200">
          <div className="stat">
            <div className="stat-title">Navigation</div>
            <div className="stat-value">Apple Maps</div>
            <div className="stat-actions">
              <button className="btn btn-sm btn-success" disabled>
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      <AboutCard />
      <CreditsCard />
    </div>
  );
};

export default MenuPage;

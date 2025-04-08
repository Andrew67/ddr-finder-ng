/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useStore } from "@nanostores/preact";

import {
  $iosNavigationApp,
  $iosNavigationAppName,
} from "../../stores/navigationApp.ts";
import { NavigationAppSelector } from "./NavigationAppSelector.tsx";
import { useState } from "preact/hooks";

export const NavigationAppCard: FunctionComponent = () => {
  const appId = useStore($iosNavigationApp);
  const appName = useStore($iosNavigationAppName);

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="stats sm:stats-vertical bg-base-200">
        <div className="stat">
          <div className="stat-title">Navigation</div>
          <div className="stat-value">{appName}</div>
          <div className="stat-actions">
            <button
              className="btn btn-sm btn-success"
              onClick={() => setModalOpen(true)}
            >
              Change
            </button>
          </div>
        </div>
      </div>
      <NavigationAppSelector
        open={modalOpen}
        dismissClick={() => setModalOpen(false)}
      />
    </>
  );
};

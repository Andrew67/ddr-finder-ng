/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useStore } from "@nanostores/preact";
import { $isIos } from "@/stores/platform";

import { CreditsCard } from "./CreditsCard";
import { AboutCard } from "./AboutCard";
import { NavigationAppCard } from "./NavigationAppCard";

export const MenuPage: FunctionComponent = () => {
  const isIos = useStore($isIos);

  return (
    <div className="p-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {isIos && <NavigationAppCard />}
      <AboutCard />
      <CreditsCard />
    </div>
  );
};

export default MenuPage;

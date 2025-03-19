/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { type IconProps, IconShare, IconShare2 } from "@tabler/icons-preact";
import { useStore } from "@nanostores/preact";

import { $isMac } from "../stores/platform";

export const IconPlatformShare: FunctionComponent<IconProps> = (props) => {
  const isMac = useStore($isMac);
  return isMac ? <IconShare2 {...props} /> : <IconShare {...props} />;
};

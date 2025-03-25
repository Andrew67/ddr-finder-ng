/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useEffect, useRef } from "preact/hooks";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const mapStyleLight = "mapbox://styles/andrew67/clrwbi529011u01qseesn4gj9";
const mapStyleDark = "mapbox://styles/andrew67/clrwd8c0c014b01nl1nr0hj9k";
const mediaDark = window.matchMedia("screen and (prefers-color-scheme: dark)");
const isDarkMode = () => mediaDark.matches;

/**
 * Map view is implemented as a fixed layer underneath, in preparation
 * for a hybrid version having the native map SDK under the WebView.
 * Also, it exists outside of {@link ExplorePage} to avoid re-initialization
 * if user moves between screens (billable event with Mapbox).
 */
export const MapView: FunctionComponent = () => {
  const mapRef = useRef<mapboxgl.Map>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiYW5kcmV3NjciLCJhIjoiY2lxMDlvOHZoMDAxOWZxbm9tdnR1NjVubSJ9.35GV_5ZM6zS2R5KQCwBWqw";
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: isDarkMode() ? mapStyleDark : mapStyleLight,
    });

    const styleChanger = () => {
      mapRef.current!.setStyle(isDarkMode() ? mapStyleDark : mapStyleLight);
    };
    mediaDark.addEventListener("change", styleChanger);

    return () => {
      mediaDark.removeEventListener("change", styleChanger);
      mapRef.current!.remove();
    };
  }, []);
  return (
    <div className="absolute top-16 pt-inset-top left-0 bottom-16 short:bottom-10 pb-inset-bottom right-0">
      <div className="h-full" ref={mapContainerRef}></div>
    </div>
  );
};

export default MapView;

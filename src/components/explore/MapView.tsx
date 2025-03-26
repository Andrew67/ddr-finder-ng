/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useEffect, useRef } from "preact/hooks";

import mapboxgl, { type GeoJSONSource } from "mapbox-gl";
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
    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: isDarkMode() ? mapStyleDark : mapStyleLight,
    });
    mapRef.current = map;

    // Add zoom/bearing controls to map.
    map.addControl(new mapboxgl.NavigationControl());

    // My Location control button
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
        fitBoundsOptions: {
          maxZoom: 12,
        },
      }),
    );

    const styleChanger = () => {
      map.setStyle(isDarkMode() ? mapStyleDark : mapStyleLight);
    };
    mediaDark.addEventListener("change", styleChanger);

    const loadCustomMarkerImages = () => {
      ["pin-empty", "pin-ddr", "pin-smx"].forEach(function (imageName) {
        const imageUrl = `/img/${imageName}${isDarkMode() ? "-dark" : ""}.png`;
        map.loadImage(imageUrl, (error, image) => {
          if (error || !image) throw error;
          if (!map.hasImage(imageName)) {
            map.addImage(imageName, image, {
              pixelRatio: 2,
            });
          }
        });
      });
    };

    // Preserve custom images and data layers after style change
    // See: https://docs.mapbox.com/mapbox-gl-js/example/style-switch/
    map.on("style.load", loadCustomMarkerImages);

    return () => {
      mediaDark.removeEventListener("change", styleChanger);
      map.off("style.load", loadCustomMarkerImages);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addSourceAndLayers = () => {
      var source = map.getSource("locations") as GeoJSONSource;
      if (!source) {
        map.addSource("locations", {
          type: "geojson",
          // TODO: Get from store
          attribution: "",
          // TODO: Set source ID from store
          data: "https://ddrfinder-api.andrew67.com/v4/all/ziv.geojson",
        });
      } else {
        // TODO: Set source ID from store
        source.setData("https://ddrfinder-api.andrew67.com/v4/all/ziv.geojson");
      }

      if (!map.getLayer("zoomed-out-circle")) {
        map.addLayer(
          {
            id: "zoomed-out-circle",
            type: "circle",
            source: "locations",
            // TODO: Filter by game by pulling filters from store
            maxzoom: 9,
            paint: {
              "circle-color":
                // Tailwind CSS Fuchsia 200 (Dark) / 700 (Light)
                isDarkMode() ? "#f5d0fe" : "#a21caf",
              "circle-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                1,
                0.1,
                9,
                0.9,
              ],
            },
          },
          // Show underneath country/city/neighborhood labels
          "settlement-subdivision-label",
        );

        map.addLayer({
          id: "arcade-pin",
          type: "symbol",
          source: "locations",
          minzoom: 9,
          layout: {
            "icon-image": [
              "case",
              [">=", ["get", "has:ddr"], 1],
              "pin-ddr",
              [">=", ["get", "has:smx"], 1],
              "pin-smx",
              // TODO: PIU pin
              "pin-empty",
            ],
            "icon-size": ["interpolate", ["linear"], ["zoom"], 9, 0.3, 12, 1],
            "icon-anchor": "bottom",
            "icon-allow-overlap": true,
            "text-field": ["get", "name"],
            "text-size": 12,
            "text-anchor": "top",
            "text-optional": true,
          },
          paint: {
            // Tailwind CSS Fuchsia 200 (Dark) / 700 (Light)
            "text-color": isDarkMode() ? "#f5d0fe" : "#a21caf",
            "text-halo-color": isDarkMode() ? "black" : "white",
            "text-halo-width": 1,
            "icon-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9,
              0.5,
              10,
              1,
            ],
          },
        });
      }
    };
    map.on("style.load", addSourceAndLayers);

    const setCursorPointer = () => (map.getCanvas().style.cursor = "pointer");
    const clearCursorStyle = () => (map.getCanvas().style.cursor = "");
    map.on("mouseenter", "arcade-pin", setCursorPointer);
    map.on("mouseleave", "arcade-pin", clearCursorStyle);

    return () => {
      map.off("style.load", addSourceAndLayers);
      map.off("mouseenter", "arcade-pin", setCursorPointer);
      map.off("mouseleave", "arcade-pin", clearCursorStyle);
    };
  }, []);

  return (
    <div className="absolute top-16 pt-inset-top left-0 bottom-16 short:bottom-10 pb-inset-bottom right-0">
      <div className="h-full" ref={mapContainerRef}></div>
    </div>
  );
};

export default MapView;

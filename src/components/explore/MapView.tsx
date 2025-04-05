/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { useStore } from "@nanostores/preact";

import mapboxgl, { type GeoJSONSource } from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "./MapView.css";

import { $router } from "../../stores/router.ts";
import { $arcadesFilter, $arcadesUrl } from "../../stores/explore/arcades.ts";
import {
  $mapLocation,
  setLocationFromMap,
} from "../../stores/explore/mapLocation.ts";

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
  const page = useStore($router);
  const showMap = page?.route === "explore";

  const mapLocation = useStore($mapLocation);
  const arcadesUrl = useStore($arcadesUrl);
  const arcadesFilter = useStore($arcadesFilter);

  const mapRef = useRef<mapboxgl.Map>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Capture stored/default location for init
    const { center, zoom } = $mapLocation.get();

    mapboxgl.accessToken =
      "pk.eyJ1IjoiYW5kcmV3NjciLCJhIjoiY2lxMDlvOHZoMDAxOWZxbm9tdnR1NjVubSJ9.35GV_5ZM6zS2R5KQCwBWqw";
    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: isDarkMode() ? mapStyleDark : mapStyleLight,
      center,
      zoom,
      minZoom: 1,
    });
    mapRef.current = map;

    // Add geocoder to map
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      // @ts-expect-error Not sure why types don't match
      mapboxgl: mapboxgl,
      collapsed: true,
    });
    // Dismiss the soft keyboard on mobile devices upon selecting a result
    geocoder.on("result", function () {
      (document.activeElement as HTMLElement)?.blur();
    });
    // Wanted it in bottom right, but the mobile experience suffers
    // due to the keyboard opening and the top result being off-screen
    map.addControl(geocoder);

    // Add zoom/bearing controls to map
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

    const saveMapLastView = () => {
      setLocationFromMap({
        center: map.getCenter(),
        zoom: map.getZoom(),
      });
    };
    map.on("moveend", saveMapLastView);

    return () => {
      mediaDark.removeEventListener("change", styleChanger);
      map.off("moveend", saveMapLastView);
      map.off("style.load", loadCustomMarkerImages);

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Prevent infinite loop with `moveend` event user interaction setting mapLocation
    const { lat, lng } = map.getCenter();
    if (
      lat === mapLocation.center.lat &&
      lng === mapLocation.center.lng &&
      map.getZoom() === mapLocation.zoom
    )
      return;

    map.jumpTo(mapLocation);
  }, [mapLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addSourceAndLayers = () => {
      if (!arcadesUrl) return;

      var source = map.getSource("locations") as GeoJSONSource;
      if (!source) {
        map.addSource("locations", {
          type: "geojson",
          // TODO: Get from store
          attribution: "",
          data: arcadesUrl,
        });
      } else {
        source.setData(arcadesUrl);
      }

      if (!map.getLayer("zoomed-out-circle")) {
        map.addLayer(
          {
            id: "zoomed-out-circle",
            type: "circle",
            source: "locations",
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
      map.setFilter("arcade-pin", arcadesFilter);
      map.setFilter("zoomed-out-circle", arcadesFilter);
    };
    map.on("load", addSourceAndLayers);
    // Re-applies data source and layers on light/dark mode changes
    map.on("style.load", addSourceAndLayers);
    // Applies layer filter changes when no other changes occur
    if (map.isStyleLoaded()) addSourceAndLayers();

    const setCursorPointer = () => (map.getCanvas().style.cursor = "pointer");
    const clearCursorStyle = () => (map.getCanvas().style.cursor = "");
    map.on("mouseenter", "arcade-pin", setCursorPointer);
    map.on("mouseleave", "arcade-pin", clearCursorStyle);

    return () => {
      map.off("load", addSourceAndLayers);
      map.off("style.load", addSourceAndLayers);
      map.off("mouseenter", "arcade-pin", setCursorPointer);
      map.off("mouseleave", "arcade-pin", clearCursorStyle);
    };
  }, [arcadesUrl, arcadesFilter]);

  return (
    <div
      className={
        "fixed top-16 pt-inset-top left-0 bottom-16 short:bottom-10 pb-inset-bottom right-0 " +
        (showMap ? "" : "invisible")
      }
    >
      <div className="h-full" ref={mapContainerRef}></div>
    </div>
  );
};

export default MapView;

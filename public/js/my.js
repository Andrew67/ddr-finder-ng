/*! ddr-finder-ng | https://github.com/Andrew67/ddr-finder-ng */
/*
 Copyright (c) 2016-2024 Andrés Cordero

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
*/

"use strict";

// Wait for ONS ready
ons.ready(function () {
  // These functions run on page load ASAP.

  // Polyfill for navigator.standalone which is iOS/Safari specific.
  if (typeof navigator.standalone === "undefined") {
    navigator.standalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
  }

  // Samsung Internet has a few gotchas.
  var isSamsungInternet = /SamsungBrowser\//i.test(navigator.userAgent);

  // Contains app navigator stack.
  var myNavigator = document.getElementById("myNavigator");

  // If iOS and standalone, add a class to allow for translucent status bar padding.
  if (ons.platform.isIOS() && navigator.standalone) {
    if (ons.platform.isIPhoneX()) {
      document.documentElement.setAttribute("onsflag-iphonex-portrait", "");
    } else {
      document.documentElement.setAttribute("iphone-portrait", "");
    }
  }
  if (ons.platform.isIPhoneX()) {
    // iPhoneX landscape padding makes sense regardless of standalone mode.
    document.documentElement.setAttribute("onsflag-iphonex-landscape", "");
  }
  // Use navigator push and window pop to avoid Android back button exiting out of the app. Allows iOS back swipe too.
  // To avoid double-pop/push surrounding ons-back-button, provide a function that rewires them to use history.back().
  var enableNativeBackButton = function (pageId) {
    var backButton = document.querySelector("#" + pageId + " ons-back-button");
    if (backButton !== null) {
      backButton.onClick = function () {
        history.back();
      };
    }
  };
  var pushPage = function (pageId) {
    myNavigator.pushPage(pageId + ".html");
    history.pushState({ page: pageId }, "");
  };
  // Re-sync the navigator stack based on the page ID returned in popstate, which is fired on back AND forward buttons.
  // If the ID is missing from the stack, push it, otherwise pop. Reset to mapview as a fallback if anything gets wonky.
  var prevNavigation = Promise.resolve();
  window.addEventListener("popstate", function (e) {
    var newPage = e.state && e.state.page;
    if (newPage) {
      if (
        myNavigator.pages
          .map(function (page) {
            return page.id;
          })
          .indexOf(newPage) !== -1
      ) {
        prevNavigation = prevNavigation.then(function () {
          return myNavigator.popPage();
        });
      } else {
        prevNavigation = prevNavigation.then(function () {
          return myNavigator.pushPage(newPage + ".html");
        });
      }
    } else if (myNavigator.pages.length > 1) {
      prevNavigation = prevNavigation.then(function () {
        return myNavigator.popPage();
      });
    } else {
      prevNavigation = prevNavigation.then(function () {
        return myNavigator.resetToPage("mapview.html");
      });
    }
  });

  // End page load functions.

  // Track a goal with analytics, if available
  var trackGoal = function (goalId) {
    // Stub; awaiting new Analytics provider integration
  };

  // settingsService takes care of saving values in localStorage and retrieving casted/default values
  var settingsService = (function () {
    var module = {};
    var settings = {
      "filter-ddr-only": {
        key: "filter-ddr-only",
        type: "bool",
        defaultValue: false,
      },
      datasource: {
        key: "datasrc",
        type: "string",
        defaultValue: "ziv",
      },
      mapLastView: {
        key: "ng-map-last-view",
        type: "object",
        defaultValue: {
          // Dallas, TX, US; zoomed-out default causes too much CPU stress on slower devices
          center: { lat: 32.7157, lng: -96.8088 },
          zoom: 9,
        },
      },
      "ios-navigation": {
        key: "ios-navigation",
        type: "string",
        defaultValue: "apple",
      },
    };

    module.setValue = function (key, newValue) {
      if (settings.hasOwnProperty(key)) {
        switch (settings[key].type) {
          case "object":
            window.localStorage.setItem(
              settings[key].key,
              JSON.stringify(newValue),
            );
            break;
          default:
            window.localStorage.setItem(settings[key].key, newValue);
            break;
        }
      }
    };

    // Returns the set value, properly cast, or null for invalid keys
    module.getValue = function (key) {
      var output = null;
      if (settings.hasOwnProperty(key)) {
        var rawValue = window.localStorage.getItem(settings[key].key);
        output = rawValue;

        if (rawValue === null || rawValue === "") {
          output = settings[key].defaultValue;
        } else {
          switch (settings[key].type) {
            case "bool":
              output = rawValue === "true";
              break;
            case "object":
              try {
                output = JSON.parse(rawValue);
              } catch (e) {
                console.error(
                  "Error while extracting value for settings key: " + key,
                  e,
                );
                output = settings[key].defaultValue;
              }
              break;
            default:
              break;
          }
        }
      }
      return output;
    };

    return module;
  })();

  // Enables clickable items (used mainly for Settings/About clickable list items)
  var enableExternalLinks = function (pageid) {
    var externalLinks = document.querySelectorAll(
      "#" + pageid + " [data-href]",
    );
    for (var i = 0; i < externalLinks.length; ++i) {
      var link = externalLinks.item(i);
      link.addEventListener(
        "click",
        function () {
          openExternalLink(this.getAttribute("data-href"));
        }.bind(link),
      );
    }
  };

  /* All-in-one suite for the DDR Finder API:
       Handles AJAX data load and parameter setting / unpacking the response.
       Keeps track of source metadata and provides helper methods to generate URLs or maps and more info.
       Keeps track of previously requested areas to help avoid unnecessary AJAX requests.
    */
  var apiService = (function () {
    var module = {},
      loadedAreas = [
        /*mapboxgl.LngLatBounds*/
      ],
      sources = {
        /*API response sources*/
      };
    var API_URL = "https://ddrfinder-api.andrew67.com/locate.php";

    // Export error codes.
    module.ERROR = {
      UNEXPECTED: -1,
      DATASRC: 21,
      ZOOM: 23,
      DOS: 42,
    };

    // Returns whether the given bounding box is covered by areas that have already been loaded.
    module.isLoaded = function (latLngBounds) {
      // Test all four corners (same algorithm as Android app's alreadyLoaded method in MapViewer class).
      var loadedNE = false,
        loadedSW = false,
        loadedNW = false,
        loadedSE = false;

      for (var i = 0; i < loadedAreas.length; ++i) {
        var bounds = loadedAreas[i];
        if (bounds.contains(latLngBounds.getNorthEast())) loadedNE = true;
        if (bounds.contains(latLngBounds.getSouthWest())) loadedSW = true;
        if (bounds.contains(latLngBounds.getNorthWest())) loadedNW = true;
        if (bounds.contains(latLngBounds.getSouthEast())) loadedSE = true;
        if (loadedNE && loadedSW && loadedNW && loadedSE) break;
      }

      return loadedNE && loadedSW && loadedNW && loadedSE;
    };

    // Clears previously cached datasource metadata and loaded area bounds.
    module.clear = function () {
      loadedAreas = [];
      sources = {};
    };

    // Returns the API source metadata object given a string src from location results.
    // Automatically fills in using the fallback if given source is not found.
    module.getSource = function (src) {
      if (sources.hasOwnProperty(src)) {
        return sources[src];
      } else {
        return sources["fallback"];
      }
    };

    // Load arcade locations into the map.
    // If you want to potentially save a redundant AJAX request, call isLoaded first with these bounds.
    // The success callback receives the GeoJSON structure, and the error callback receives the error structure.
    module.getLocations = function (bounds, successcb, errorcb) {
      // Round the bounds to the nearest whole degree, for two purposes:
      // - when zoomed in, provides a smoother pan/zoom experience with reduced loading time
      // - sets the precision to a minimum of 43.5km (see: https://en.wikipedia.org/wiki/Decimal_degrees)
      //   which provides privacy to the user (especially if the bounds include their location)
      bounds = new mapboxgl.LngLatBounds(
        [Math.floor(bounds.getWest()), Math.floor(bounds.getSouth())],
        [Math.ceil(bounds.getEast()), Math.ceil(bounds.getNorth())],
      );

      // Load settings regarding data source and API URL.
      var dataSource = settingsService.getValue("datasource");
      const url = new URL(
        `${API_URL}?version=31&sourceformat=object&locationformat=geojson&canHandleLargeDataset`,
      );
      url.searchParams.set("datasrc", dataSource);
      url.searchParams.set("latlower", bounds.getSouth());
      url.searchParams.set("lnglower", bounds.getWest());
      url.searchParams.set("latupper", bounds.getNorth());
      url.searchParams.set("lngupper", bounds.getEast());

      // Kick off AJAX request.
      var request = new XMLHttpRequest();
      request.onreadystatechange = function () {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            var response = JSON.parse(this.responseText);

            // Merge received sources in.
            for (var k in response.sources) {
              if (response.sources.hasOwnProperty(k)) {
                sources[k] = response.sources[k];
              }
            }
            loadedAreas.push(bounds);
            successcb(response.locations);
          } else if (this.status === 400) {
            errorcb(JSON.parse(this.responseText));
          } else {
            errorcb({
              errorCode: -1,
              error:
                "Unexpected XMLHttpRequest header (does the URL support CORS?)",
            });
          }
        }
      };
      request.open("GET", url.toString(), true);
      request.send(null);
    };

    return module;
  })();

  /** Returns a filter expression for the "arcade-pin" layer, depending on whether we filter by having DDR or not */
  const getLayerFilter = (filterDDROnly) => {
    return filterDDROnly ? ["==", ["get", "hasDDR"], 1] : true;
  };

  // Navigation URL generator functions and platform detection (originally from ddr-finder).
  var getNavURL = (function () {
    var getGoogleMapsURL = function (lat, lng, label) {
      return (
        "https://maps.google.com/?q=loc:" +
        lat +
        "," +
        lng +
        "(" +
        encodeURIComponent(label) +
        ")"
      );
    };
    var getGeoURI = function (lat, lng, label) {
      return (
        "geo:" +
        lat +
        "," +
        lng +
        "?q=" +
        lat +
        "," +
        lng +
        "(" +
        encodeURIComponent(label) +
        ")"
      );
    };

    if (ons.platform.isIOS())
      return function (lat, lng, label) {
        switch (settingsService.getValue("ios-navigation")) {
          case "google":
            return getGoogleMapsURL(lat, lng, label).replace(
              "https://",
              "comgooglemapsurl://",
            );
          case "waze":
            return "waze://?ll=" + lat + "," + lng;
          case "sygic":
            return "com.sygic.aura://coordinate|" + lng + "|" + lat + "|drive";
          case "here":
            return (
              "here-location://" +
              lat +
              "," +
              lng +
              "," +
              encodeURIComponent(label)
            );
          case "mapsme":
            return (
              "mapswithme://map?v=1.1&ll=" +
              lat +
              "," +
              lng +
              "&n=" +
              encodeURIComponent(label)
            );
          case "magicearth":
            return (
              "magicearth://?show_on_map&lat=" +
              lat +
              "&lon=" +
              lng +
              "&name=" +
              encodeURIComponent(label)
            );
          case "baidu":
            return (
              "baidumap://map/marker?location=" +
              lat +
              "," +
              lng +
              "&title=" +
              encodeURIComponent(label) +
              "&content=" +
              encodeURIComponent("GPS: " + lat + "°, " + lng + "°") +
              "&coord_type=wgs84&src=ios.baidu.openAPIdemo"
            );
          case "gaode":
            return (
              "iosamap://viewMap?sourceApplication=applicationName" +
              "&poiname=" +
              encodeURIComponent(label) +
              "&lat=" +
              lat +
              "&lon=" +
              lng +
              "&dev=1"
            );
          case "kakaomap":
            return "kakaomap://look?p=" + lat + "," + lng;
          case "navermap":
            // Could not find a way to trigger a marker pin via nmap:// or navermap://,
            // just opened the app to the main screen. Users can "Open via App" after starting a route plan
            return "https://map.naver.com/?elat=" + lat + "&elng=" + lng;
          case "apple":
          default:
            return (
              "maps:?q=" + encodeURIComponent(label) + "&ll=" + lat + "," + lng
            );
        }
      };
    else if (ons.platform.isAndroid()) {
      if (ons.platform.isFirefox() || isSamsungInternet) {
        // As of writing, intent: URIs are not being handled well:
        // Firefox ESR 68 in standalone mode does nothing
        // Firefox Preview 5 jumps to fall-back URL, even when "Open in Apps" is enabled; standalone goes to search?!
        // Samsung Internet 11 in standalone mode opens a new window then crashes!!
        return getGeoURI;
      }
      return function (lat, lng, label) {
        // intent URI allows us to combine the following two:
        // geo URI that triggers app picker
        //     geo:lat,lng?q=lat,lng(encoded label)
        // Google Maps URI if no apps available to handle geo
        //     https://maps.google.com/?q=loc:lat,lng(encoded label)
        // See: https://developer.chrome.com/multidevice/android/intents
        return (
          getGeoURI(lat, lng, label).replace("geo:", "intent:") +
          "#Intent;scheme=geo;" +
          "S.browser_fallback_url=" +
          encodeURIComponent(getGoogleMapsURL(lat, lng, label)) +
          ";" +
          "end;"
        );
      };
    } else return getGoogleMapsURL;
  })();

  // "More Info" URL function
  var getInfoURL = (function () {
    var infoProperty = "infoURL";
    if (ons.platform.isAndroid() || ons.platform.isIOS())
      infoProperty = "mInfoURL";

    return function (location) {
      return apiService
        .getSource(location.src)
        [infoProperty].replace("${id}", location.id)
        .replace("${sid}", location.sid);
    };
  })();

  // Window open function for external links, which requires a workaround on iOS, as Safari requires <a href>.
  // From: http://stackoverflow.com/a/8833025
  // For non-http(s) links (app-trigger links), retains current context (avoids flash of a browser window before trigger).
  // intent URIs with fallback will also fire a window.open (except in standalone mode; as Chrome would jump to fallback),
  // otherwise it opens within the same application frame.
  var openExternalLink = function (href) {
    if (
      href.indexOf("http") === 0 ||
      (href.indexOf("intent") === 0 &&
        href.indexOf("S.browser_fallback_url" > 0) &&
        !navigator.standalone)
    ) {
      if (ons.platform.isIOS()) {
        var a = document.createElement("a");
        a.setAttribute("href", href);
        a.setAttribute("target", "_blank");

        var dispatch = document.createEvent("HTMLEvents");
        dispatch.initEvent("click", true, true);
        a.dispatchEvent(dispatch);
      } else {
        window.open(href);
      }
    } else {
      window.location.href = href;
    }
  };

  // Get the lat/lng and zoom to use for map initialization. In order:
  // - Parameters specified in query portion of URL (?ll={lat},{lng}&z={zoom})
  // - lastView from LocalStorage
  // - Default (TX, US)
  var getInitialView = function () {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.has("ll") && params.has("z")) {
        const ll = params.get("ll").split(",");
        const zoom = params.get("z").replace("z", "");
        return {
          center: { lat: ll[0], lng: ll[1] },
          zoom,
        };
      }
    }
    return settingsService.getValue("mapLastView");
  };

  // Each view exports certain functions, but contains its own scope

  // mapview
  var mapview = (function () {
    var module = {};

    var map = null;
    var loadedLocationIds = []; // Stores loaded location ids, to prevent loading duplicate markers on the map.
    var dataLoadHandler = function () {}; // Defined here for access in show event; see below for true definition.

    module.init = function (page) {
      // errorMsg can clear all errors or show a specific one, from the error-box div.
      var errorMsg = (function () {
        var module = {};
        var errorMessages = {
          unexpected: "Unexpected error while loading data",
          zoom: "Zoom in to load more locations",
          datasrc: "Server did not recognize the data source(s) requested",
        };

        module.show = function (msgId) {
          return ons.notification.toast(errorMessages[msgId], {
            timeout: 2000,
            animation: "fade",
          });
        };

        return module;
      })();

      // If user navigated to the map from the main page or a nearby search, go back
      // otherwise do an "up" navigation back to main screen
      document
        .getElementById("mapview-back")
        .addEventListener("click", function () {
          if (document.referrer.includes(window.location.host)) {
            window.history.back();
          } else {
            window.location.href = "/";
          }
        });

      // If Web Share API is supported, insert a share button into the toolbar (shares current URL).
      // See: https://developers.google.com/web/updates/2016/09/navigator-share
      if ("share" in navigator) {
        // See: https://onsen.io/v2/api/js/ons-toolbar-button.html
        var shareButton = document.createElement("ons-toolbar-button");
        shareButton.addEventListener("click", function () {
          navigator.share({ url: window.location.href });
        });
        var shareButtonIcon = document.createElement("ons-icon");
        shareButtonIcon.setAttribute(
          "icon",
          "ion-ios-share, material:ion-md-share",
        );
        shareButton.appendChild(shareButtonIcon);
        document
          .getElementById("mapview-toolbar-buttons")
          .appendChild(shareButton);
      }

      // Get the map style (for auto-switching light and dark)
      const isDarkMode = () =>
        window.matchMedia("screen and (prefers-color-scheme: dark)").matches;
      const getMapStyleUri = function () {
        return isDarkMode()
          ? "mapbox://styles/andrew67/clrwd8c0c014b01nl1nr0hj9k"
          : "mapbox://styles/andrew67/clrwbi529011u01qseesn4gj9";
      };

      // Initialize map and set initial view.
      var initialView = getInitialView();
      mapboxgl.accessToken =
        "pk.eyJ1IjoiYW5kcmV3NjciLCJhIjoiY2lxMDlvOHZoMDAxOWZxbm9tdnR1NjVubSJ9.35GV_5ZM6zS2R5KQCwBWqw";
      map = new mapboxgl.Map({
        container: "map",
        style: getMapStyleUri(),
        center: [initialView.center.lng, initialView.center.lat],
        zoom: initialView.zoom,
        renderWorldCopies: false,
        maxBounds: [
          [-180, -85],
          [180, 85],
        ],
        // Wanted to choose `naturalEarth` but that one breaks the geolocator.
        // End goal is `globe` but the clusters are broken in it / performance concerns.
        projection: "mercator",
        attributionControl: false,
      });
      map.addControl(new mapboxgl.AttributionControl({ compact: false }));

      const loadCustomMarkerImages = function () {
        ["pin-empty", "pin-ddr"].forEach(function (imageName) {
          map.loadImage(
            "/img/" + imageName + (isDarkMode() ? "-dark" : "") + ".png",
            function (error, image) {
              if (error) throw error;
              else if (!map.hasImage(imageName)) {
                map.addImage(imageName, image, {
                  pixelRatio: 2,
                });
              }
            },
          );
        });
      };
      map.on("style.load", () => loadCustomMarkerImages());

      // Register listener for light/dark-mode switch
      // TODO: Currently throws away locations data. See: https://docs.mapbox.com/mapbox-gl-js/example/style-switch/
      // window
      //   .matchMedia("screen and (prefers-color-scheme: dark)")
      //   .addEventListener("change", function () {
      //     map.setStyle(getMapStyleUri());
      //   });

      // Skip the geocoder feature on browsers that fail to load the library
      if ("MapboxGeocoder" in window) {
        var geocoder = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          mapboxgl: mapboxgl,
          marker: false,
          // On iOS standalone, expanding the collapsed search is a bit tricky, so disabling collapse instead
          collapsed: !(ons.platform.isIOS() && navigator.standalone),
          clearAndBlurOnEsc: true,
          flyTo: {
            animate: false,
          },
          // On iOS standalone, OnsenUI's FastClick does not play well with the Geocoder,
          // so we override the render method to insert the needsclick class which excludes results from FastClick
          render: function (item) {
            var placeName = item.place_name.split(",");
            return (
              '<div class="mapboxgl-ctrl-geocoder--suggestion">' +
              '<div class="mapboxgl-ctrl-geocoder--suggestion-title needsclick">' +
              placeName[0] +
              '</div><div class="mapboxgl-ctrl-geocoder--suggestion-address needsclick">' +
              placeName.splice(1, placeName.length).join(",") +
              "</div></div>"
            );
          },
        });
        // Dismiss the soft keyboard on mobile devices upon selecting a result
        geocoder.on("result", function () {
          document.activeElement.blur();
        });
        map.addControl(geocoder);
      }

      // Add zoom/bearing controls to map.
      map.addControl(new mapboxgl.NavigationControl());

      // My Location control button
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          fitBoundsOptions: {
            animate: false,
            maxZoom: 15,
          },
        }),
      );

      // Custom actions (refresh, settings, Android app, etc.)
      // See: https://docs.mapbox.com/mapbox-gl-js/api/#icontrol
      function MyControl() {}
      MyControl.prototype.onAdd = function () {
        this._container = document.createElement("div");
        this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

        // Reload
        var reloadButton = this.getButton(
          "Reload",
          "ion-ios-refresh, material:ion-md-refresh",
        );
        reloadButton.addEventListener("click", function () {
          dataLoadHandler(null, true);
        });
        this._container.appendChild(reloadButton);

        // Settings
        var settingsButton = this.getButton(
          "Settings",
          "ion-ios-settings, material:ion-md-settings",
        );
        settingsButton.addEventListener("click", function () {
          pushPage("settings");
        });
        this._container.appendChild(settingsButton);

        // Open Android App
        if (ons.platform.isAndroid()) {
          var openInAppButton = this.getButton("Open in App", "ion-md-apps");
          openInAppButton.addEventListener("click", function () {
            openExternalLink(
              "intent://ddrfinder.andrew67.com/ng" +
                (window.location.search ? window.location.search : "") +
                "#Intent;package=com.andrew67.ddrfinder;scheme=https;end",
            );
          });
          this._container.appendChild(openInAppButton);
        }

        return this._container;
      };
      MyControl.prototype.onRemove = function () {
        this._container.parentNode.removeChild(this._container);
      };
      MyControl.prototype.getButton = function (title, icon) {
        var button = document.createElement("button");
        button.className = "mapboxgl-ctrl-ons";
        button.setAttribute("title", title);
        button.setAttribute("aria-label", title);
        var iconEl = document.createElement("ons-icon");
        iconEl.setAttribute("icon", icon);
        iconEl.setAttribute("aria-hidden", "true");
        button.appendChild(iconEl);
        return button;
      };
      map.addControl(new MyControl());

      // More Info / Navigate action handlers for locations.
      var onMoreInfo = function (feature) {
        trackGoal(5);
        openExternalLink(getInfoURL(feature.properties));
      };

      var selectedFeature = null;
      var navigationAppToast = document.getElementById("navigation-app-toast");
      navigationAppToast.addEventListener("click", function () {
        navigationAppToast.hide();
      });
      document.addEventListener("visibilitychange", function () {
        navigationAppToast.hide({ animation: "none" });
      });
      var onNavigate = function (feature) {
        trackGoal(3);

        // If iOS and non-default map application, attempt to detect missing app and offer to switch to Apple Maps and retry.
        if (
          ons.platform.isIOS() &&
          settingsService.getValue("ios-navigation") !== "apple"
        ) {
          selectedFeature = feature;
          setTimeout(function () {
            navigationAppToast.show();
          }, 1000);
        }

        openExternalLink(
          getNavURL(
            feature.geometry.coordinates[1].toFixed(6),
            feature.geometry.coordinates[0].toFixed(6),
            feature.properties.name,
          ),
        );
      };

      /**
       * Resets the user's iOS navigation app preference to Apple Maps,
       * then attempts to navigate to the last selected feature, if available
       */
      var fallbackToAppleMaps = function () {
        settingsService.setValue("ios-navigation", "apple");
        if (selectedFeature) onNavigate(selectedFeature);
      };
      document
        .getElementById("navigation-app-toast-button")
        .addEventListener("click", fallbackToAppleMaps);

      // This function is called when an arcade location on the map is clicked.
      var buildPopupDOM = function (feature) {
        var popupContainer = document.createElement("div");

        var description = document.createElement("div");
        description.classList.add("description");
        var descriptionHTML = "<p><b>" + feature.properties.name + "</b></p>";
        if (feature.properties.city.length !== 0) {
          descriptionHTML +=
            "<p><i>City</i>: " + feature.properties.city + "</p>";
        }
        if (apiService.getSource(feature.properties.src)["hasDDR"]) {
          descriptionHTML +=
            '<p class="hasDDR"><i>DDR</i>: <span class="hasDDR' +
            (feature.properties.hasDDR ? "Yes" : "No") +
            '"><ons-icon icon="' +
            (feature.properties.hasDDR
              ? "ion-ios-checkmark"
              : "ion-ios-close") +
            '"></ons-icon> ' +
            (feature.properties.hasDDR ? "Yes" : "No") +
            "</span></p>";
        }
        descriptionHTML +=
          "<p><i>GPS</i>: " +
          feature.geometry.coordinates[1].toFixed(4) +
          "°, " +
          feature.geometry.coordinates[0].toFixed(4) +
          "°</p>";
        description.innerHTML = descriptionHTML;

        var buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        var moreInfo = document.createElement("ons-button");
        moreInfo.textContent = "More Info";
        moreInfo.setAttribute("modifier", "quiet");
        moreInfo.addEventListener("click", function () {
          onMoreInfo(feature);
        });
        buttonContainer.appendChild(moreInfo);

        var navigate = document.createElement("ons-button");
        navigate.textContent = "Navigate";
        navigate.addEventListener("click", function () {
          onNavigate(feature);
        });
        buttonContainer.appendChild(navigate);

        popupContainer.appendChild(description);
        popupContainer.appendChild(buttonContainer);
        return popupContainer;
      };

      // Takes care of loading and attaching GeoJSON data from API when map dragend/zoomend is fired, etc.
      // Clears and sets errors when necessary as well.
      var progressBar = document.getElementById("progress-bar");
      dataLoadHandler = function (event, forceLoad, replaceAll) {
        if (!apiService.isLoaded(map.getBounds()) || forceLoad) {
          progressBar.hidden = false;

          var commonCleanup = function () {
            progressBar.hidden = true;
          };

          apiService.getLocations(
            map.getBounds(),
            function (locations) {
              commonCleanup();

              // Filter already loaded locations from the features list before (re)adding to map.
              locations.features = replaceAll
                ? locations.features
                : locations.features.filter(function (location) {
                    if (
                      loadedLocationIds.indexOf(location.properties.id) === -1
                    ) {
                      loadedLocationIds.push(location.properties.id);
                      return true;
                    }
                    return false;
                  });

              // Create or update the GeoJSON locations layer with the incoming data.
              var source = map.getSource("locations");
              if (!source) {
                map.addSource("locations", {
                  type: "geojson",
                  // TODO: Leverage the homepageURL property now returned by API to populate this
                  attribution:
                    "&copy; " +
                    '<a href="https://zenius-i-vanisher.com/" target="_blank" data-src="ziv">Zenius -I- vanisher.com</a>' +
                    '<a href="https://ddr-navi.jp/" target="_blank" data-src="navi">DDR-Navi</a>' +
                    '<a href="https://openstreetmap.org/" target="_blank" data-src="osm">OpenStreetMap</a>',
                  data: locations,
                });
              } else {
                source.setData({
                  type: source._data.type,
                  features: replaceAll
                    ? locations.features
                    : source._data.features.concat(locations.features),
                });
              }

              if (!map.getLayer("zoomed-out-circle")) {
                const filterDDROnly =
                  settingsService.getValue("filter-ddr-only");
                map.addLayer(
                  {
                    id: "zoomed-out-circle",
                    type: "circle",
                    source: "locations",
                    filter: getLayerFilter(filterDDROnly),
                    maxzoom: 10,
                    paint: {
                      "circle-color": [
                        "match",
                        ["get", "hasDDR"],
                        1,
                        // Tailwind CSS Fuchsia 200 (Dark) / 700 (Light)
                        isDarkMode() ? "#f5d0fe" : "#a21caf",
                        // Keep same color for non-DDR arcades for now
                        isDarkMode() ? "#f5d0fe" : "#a21caf",
                      ],
                      "circle-opacity": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        1,
                        0.1,
                        10,
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
                  filter: getLayerFilter(filterDDROnly),
                  minzoom: 10,
                  layout: {
                    "icon-image": [
                      "match",
                      ["get", "hasDDR"],
                      1,
                      "pin-ddr",
                      "pin-empty",
                    ],
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
                  },
                });

                map.on("click", "arcade-pin", function (e) {
                  var feature = e.features[0];
                  var coordinates = feature.geometry.coordinates.slice();

                  // Ensure that if the map is zoomed out such that
                  // multiple copies of the feature are visible, the
                  // popup appears over the copy being pointed to.
                  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] +=
                      e.lngLat.lng > coordinates[0] ? 360 : -360;
                  }

                  // offset places the pop-up in the middle of the 44px-tall pin
                  new mapboxgl.Popup({ offset: [0, -28] })
                    .setLngLat(coordinates)
                    .setDOMContent(buildPopupDOM(feature))
                    .addTo(map);
                });
                map.on("mouseenter", "arcade-pin", function () {
                  map.getCanvas().style.cursor = "pointer";
                });
                map.on("mouseleave", "arcade-pin", function () {
                  map.getCanvas().style.cursor = "";
                });
              }
            },
            function (error) {
              commonCleanup();

              switch (error.errorCode) {
                case apiService.ERROR.ZOOM:
                  errorMsg.show("zoom");
                  break;
                case apiService.ERROR.DATASRC:
                  errorMsg.show("datasrc");
                  break;
                default:
                  errorMsg.show("unexpected");
                  console.error(error);
                  break;
              }
            },
          );
        }
      };
      map.on("dragend", dataLoadHandler);
      map.on("zoomend", dataLoadHandler);
      map.on("locationfound", dataLoadHandler);

      // Store current map view (center/zoom) after user action in order to return to it on re-init/share.
      var lastViewPreserver = function () {
        var center = map.getCenter();
        var zoom = map.getZoom();
        settingsService.setValue("mapLastView", {
          center: { lat: center.lat, lng: center.lng },
          zoom: zoom,
        });
        history.replaceState(
          {},
          "",
          "?ll=" +
            center.lat.toFixed(5) +
            "," +
            center.lng.toFixed(5) +
            "&z=" +
            zoom.toFixed(1),
        );
      };
      map.on("dragend", lastViewPreserver);
      map.on("zoomend", lastViewPreserver);
      map.on("locationfound", lastViewPreserver);

      // Load on mapview init.
      apiService.clear();
      map.on("load", dataLoadHandler);
      lastViewPreserver();
    };

    var prevDatasrc = null,
      prevFilterDDROnly = null;

    module.show = function () {
      // Trigger changes if certain settings changed while away from the map.
      // TODO: Involve some sort of caching layer, as this behavior causes network requests to happen.
      var currFilterDDROnly = settingsService.getValue("filter-ddr-only");
      var currDatasrc = settingsService.getValue("datasource");
      document.body.setAttribute("data-src", currDatasrc); // Used with CSS for attributions
      if (prevDatasrc !== null && prevDatasrc !== currDatasrc) {
        apiService.clear();
        loadedLocationIds = [];
        dataLoadHandler(null, false, true);
      }
      if (
        prevFilterDDROnly !== null &&
        prevFilterDDROnly !== currFilterDDROnly
      ) {
        map.setFilter("arcade-pin", getLayerFilter(currFilterDDROnly));
        map.setFilter("zoomed-out-circle", getLayerFilter(currFilterDDROnly));
      }

      // Trigger resize on the map when returning to the map page.
      // This is used to handle the following case:
      // Navigating to Settings/About and visiting an external link, then returning to the webapp causes the map
      // to resize itself, however since the map page is `display: none` at that time, it considers the height
      // as 0 and falls back to a 300px height, without ever re-assessing.
      // See: https://github.com/mapbox/mapbox-gl-js/issues/3265
      if (map) map.resize();
    };

    module.hide = function () {
      // Capture settings we care about, so we can check if they changed on show and react appropriately
      prevDatasrc = settingsService.getValue("datasource");
      prevFilterDDROnly = settingsService.getValue("filter-ddr-only");
    };

    return module;
  })();

  // settings
  var settings = (function () {
    var module = {};
    // Extract the label for a given multi select value
    var setLabel = function (id, value) {
      document.querySelector(
        "#settings-" + id + " .list-item__subtitle",
      ).textContent = document
        .querySelector("label[for=settings-" + id + "-" + value + "]")
        .textContent.trim();
    };

    // React to onChange events on the form and save the values in localStorage.
    var formChangeHandler = function (e) {
      var option = e.target;
      var key = null;
      var newValue = null;

      switch (option.name || option.id) {
        // Switch cases
        case "settings-filter-ddr-only-switch":
          key = "filter-ddr-only";
          newValue = option.checked;
          break;
        // Dialog cases
        case "datasource":
        case "ios-navigation":
          key = option.name;
          newValue = option.id.replace("settings-" + key + "-", "");

          // Update UI label and hide the dialog
          document.getElementById("settings-" + key + "-dialog").hide();
          setLabel(key, newValue);
          break;
        default:
          break;
      }

      if (key !== null && newValue !== null) {
        settingsService.setValue(key, newValue);
      }
    };

    module.init = function (page) {
      // Hide the iOS items on non-iOS devices; cannot wrap in <ons-if> as it breaks iPhoneX padding
      if (!ons.platform.isIOS()) {
        var iOSNavSettingEl = document.getElementById(
          "settings-ios-navigation",
        );
        if (iOSNavSettingEl) iOSNavSettingEl.remove();
      }
      if (!ons.platform.isIOS() || navigator.standalone) {
        var iOSInstallInstructions = document.getElementById(
          "settings-ios-install",
        );
        if (iOSInstallInstructions) iOSInstallInstructions.remove();
      }

      document
        .getElementById("about-button")
        .addEventListener("click", function () {
          pushPage("about");
        });

      page.addEventListener("change", formChangeHandler);

      // Initialize switch label event listener and current value
      ["filter-ddr-only"].forEach(function (key) {
        var _switch = document.getElementById("settings-" + key + "-switch");
        document
          .querySelector("#settings-" + key + " .center")
          .addEventListener("click", function () {
            _switch.click();
          });
        _switch.checked = settingsService.getValue(key);
      });

      // Set the dialog listeners and initialize label and radio buttons to the current values
      var dialogs = ["datasource"];
      if (ons.platform.isIOS()) dialogs.push("ios-navigation");

      dialogs.forEach(function (key) {
        var dialog = document.getElementById("settings-" + key + "-dialog");
        document
          .getElementById("settings-" + key)
          .addEventListener("click", function () {
            dialog.show();
          });
        document
          .getElementById("settings-" + key + "-cancel")
          .addEventListener("click", function () {
            dialog.hide();
          });
        var currentValue = settingsService.getValue(key);
        setLabel(key, currentValue);
        document.getElementById(
          "settings-" + key + "-" + currentValue,
        ).checked = true;
      });
    };

    return module;
  })();

  document.addEventListener("init", function (e) {
    var page = e.target;

    enableExternalLinks(page.id);
    enableNativeBackButton(page.id);

    if (page.id === "mapview") mapview.init(page);
    else if (page.id === "settings") settings.init(page);
  });

  document.addEventListener("show", function (e) {
    var page = e.target;

    if (page.id === "mapview") mapview.show(page);
  });

  document.addEventListener("hide", function (e) {
    var page = e.target;

    if (page.id === "mapview") mapview.hide(page);
  });
});

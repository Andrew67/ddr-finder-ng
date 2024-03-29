/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
"use strict";
// Functionality for locator page
$(function () {
  /** Mapbox Static API URL Builder */
  function MapBuilder() {
    this.width = Math.min(window.innerWidth, 640) - 32 - 2; // manual calculation of body padding and image border
    this.height = 216;
    this.url =
      "https://api.mapbox.com/styles/v1/andrew67/clrwbi529011u01qseesn4gj9/static/";
    this.darkUrl =
      "https://api.mapbox.com/styles/v1/andrew67/clrwd8c0c014b01nl1nr0hj9k/static/";
    this.urlSuffix = `/auto/${this.width}x${this.height}@2x?access_token=pk.eyJ1IjoiYW5kcmV3NjciLCJhIjoiY2lxMDlvOHZoMDAxOWZxbm9tdnR1NjVubSJ9.35GV_5ZM6zS2R5KQCwBWqw`;
    this.nextMarkerNumber = 0;
  }
  MapBuilder.prototype.getURL = function () {
    return this.url + this.urlSuffix;
  };
  MapBuilder.prototype.getDarkURL = function () {
    return this.darkUrl + this.urlSuffix;
  };
  MapBuilder.prototype.addMyLocationMarker = function (lat, lng) {
    // Must be called before any addMarker calls
    var latFixed = lat.toFixed(4),
      lngFixed = lng.toFixed(4);
    // Tailwind CSS Red 700 (Light) / 200 (Dark)
    this.url += `pin-s+b91c1c(${lngFixed},${latFixed})`;
    this.darkUrl += `pin-s+fecaca(${lngFixed},${latFixed})`;
  };
  MapBuilder.prototype.addMarker = function (lat, lng) {
    // Warning: limited to 9 for labels
    var label = ++this.nextMarkerNumber,
      latFixed = lat.toFixed(4),
      lngFixed = lng.toFixed(4);
    // Tailwind CSS Fuchsia 700 (Light) / 200 (Dark)
    this.url += `,pin-l-${label}+a21caf(${lngFixed},${latFixed})`;
    this.darkUrl += `,pin-l-${label}+f5d0fe(${lngFixed},${latFixed})`;
  };
  var locationMap = new MapBuilder();

  // Prefixes for arcade item navigation links
  var GMAPS_PREFIX = "https://maps.google.com/?q=loc:";
  var NAV_PREFIX_ANDROID = "geo:";
  var NAV_PREFIX_IOS = "maps:?q=&saddr=Current%20Location&daddr=loc:";
  var NAV_PREFIX_WP7 = "maps:";
  var NAV_PREFIX_W10 = "bingmaps:?rtp=~pos.";
  var NAV_PREFIX = "#";

  // Navigation URL generator functions
  var nav_url = function (latitude, longitude, label) {
    return `${NAV_PREFIX}${latitude},${longitude}(${encodeURIComponent(
      label,
    )})`;
  };
  var nav_url_android = function (latitude, longitude, label) {
    return `${NAV_PREFIX_ANDROID}${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(
      label,
    )})`;
  };
  var nav_url_ios = function (latitude, longitude, label) {
    return `${NAV_PREFIX_IOS}${latitude},${longitude}(${encodeURIComponent(
      label,
    )})`;
  };
  var nav_url_wp7 = function (latitude, longitude) {
    return `${NAV_PREFIX_WP7}${latitude} ${longitude}`;
  };
  var nav_url_w10 = function (latitude, longitude, label) {
    return `${NAV_PREFIX_W10}${latitude}_${longitude}_${encodeURIComponent(
      label,
    )}`;
  };

  // Detect platform and set generator function
  var platform = "mobile";
  if (/Windows Phone/i.test(navigator.userAgent)) nav_url = nav_url_wp7;
  else if (/WM 10/i.test(navigator.userAgent)) nav_url = nav_url_w10;
  else if (/Android/i.test(navigator.userAgent)) nav_url = nav_url_android;
  else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) nav_url = nav_url_ios;
  else platform = "pc";
  if (/Mac OS X/i.test(navigator.userAgent)) nav_url = nav_url_ios;
  else if (/Windows NT 10/i.test(navigator.userAgent)) nav_url = nav_url_w10;

  // Get user-selected data source(s) or set to default (Z-I-v)
  var datasrc = localStorage.getItem("datasrc");
  if (null === datasrc) datasrc = "ziv";

  // Source info URL/name functions
  var info_url = function (metadata, src, id, sid) {
    var property = "infoURL";
    if ("mobile" === platform) property = "mInfoURL";
    if (!(src in metadata)) src = "fallback";
    return metadata[src][property].replace("${id}", id).replace("${sid}", sid);
  };
  var info_name = function (metadata, src) {
    if (!(src in metadata)) src = "fallback";
    return metadata[src].name;
  };

  // Geolocation error handler
  var handle_geolocation_error = function (error) {
    // Permission denied
    if (error.code === 1) {
      $("#message-waiting").hide();
      $("#message-denied").show();
    }
    // Position unavailable or timeout
    else if (error.code === 2 || error.code === 3) {
      $("#message-waiting").hide();
      $("#message-failed").show();
    }
  };

  // Arcade location data handler function
  var handle_data = function (/* import("types.d.ts").APIData */ data) {
    var locations = data.locations,
      message_arcade_list = $("#message-arcade-list"),
      arcade_list = $("#arcade-list");

    // Empty out arcade list container from previous runs (when changing hash only, previous entries remained).
    $(".arcade-list-item:not(:first-child)").remove();

    $("#message-found-searching").hide();
    message_arcade_list.show();

    if (locations.length === 0) {
      $("#arcade-list-container").hide();
      $("#arcade-noresults-container").show();
    } else {
      // Set contributor website name and URL.
      if (data.sources[datasrc] && data.sources[datasrc].homepageURL) {
        var contributor_link = $("#source-website-url");
        contributor_link.text(data.sources[datasrc].name);
        contributor_link.attr("href", data.sources[datasrc].homepageURL);
      }

      // Determine if the selected source has DDR availability provided; set a class if not the case.
      if (!data.sources[datasrc] || !data.sources[datasrc].hasDDR) {
        message_arcade_list.addClass("has-ddr-unavailable");
      }

      // Grab the item layout element.
      // For each location found, clone the layout, fill in the details, and add it to the list.
      var arcade_list_item = $(".arcade-list-item:first-child");
      locations.forEach(function (location, i) {
        var arcade = arcade_list_item.clone();
        const { name, city, distance, lat, lng, src, hasDDR, id, sid } =
          location;

        arcade.find(".arcade-name").text(name);
        arcade.find(".arcade-city").text(city);
        arcade.find(".arcade-distance").text(distance);
        arcade.find(".arcade-latitude").text(lat.toFixed(4));
        arcade.find(".arcade-longitude").text(lng.toFixed(4));
        arcade.find(".arcade-info-name").text(info_name(data.sources, src));
        arcade
          .find(hasDDR ? ".arcade-has-ddr-no" : ".arcade-has-ddr-yes")
          .remove();
        arcade.find(".arcade-has-ddr-text").text(hasDDR ? "Yes" : "No");

        const latUrlFixed = lat.toFixed(6),
          lngUrlFixed = lng.toFixed(6),
          mapSuffix = `${latUrlFixed},${lngUrlFixed}(${encodeURIComponent(
            name,
          )})`;
        arcade
          .find(".arcade-nav")
          .attr("href", nav_url(latUrlFixed, lngUrlFixed, name));
        arcade.find(".arcade-gmaps").attr("href", GMAPS_PREFIX + mapSuffix);
        arcade
          .find(".arcade-info")
          .attr("href", info_url(data.sources, src, id, sid));
        arcade.appendTo(arcade_list);

        // The first 5 locations get added to the "Your Location" mini-map as well.
        // To keep the map from zooming out too much, the distance is capped to 15km past the first 3 results,
        // unless result #2 already exceeded these bounds (sparse area).
        if (i < 5 && (i < 3 || distance < 15 || locations[1].distance >= 15)) {
          locationMap.addMarker(lat, lng);
        }
      });
    }
  };

  // Arcade location API error handler
  var handle_data_error = function () {
    $("#message-found-searching").hide();
    $("#message-api-failed").show();
  };

  // Load location map based on builder so far
  var load_location_map = function () {
    $("#current-location-img").empty();
    $(
      `<picture>
        <source media="screen and (prefers-color-scheme: dark)" srcset="${locationMap.getDarkURL()}">
        <img alt="Current Location" width="${locationMap.width}" height="${
          locationMap.height
        }" src="${locationMap.getURL()}">
      </picture>`,
    ).appendTo("#current-location-img");
  };

  // Geolocation ok handler
  var handle_geolocation_ok = function (position) {
    const { latitude, longitude, accuracy } = position.coords;
    $("#message-waiting").hide();
    $("#message-found-searching").show();
    var coords = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    $("#current-location-link").attr("href", `/ng/?ll=${coords}&z=14`);
    locationMap = new MapBuilder();
    locationMap.addMyLocationMarker(latitude, longitude);

    if (accuracy) {
      var accuracyText =
        accuracy >= 1000
          ? "" + (accuracy / 1000).toFixed(2) + "km"
          : "" + accuracy.toFixed() + " meters";
      $("#current-location-accuracy-value").text(accuracyText);
      $("#current-location-accuracy").show();
    } else {
      $("#current-location-accuracy").hide();
    }

    // Locate nearby machines and populate/show list
    $.getJSON("https://ddrfinder-api.andrew67.com/locate.php", {
      version: 20,
      datasrc: datasrc,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    })
      .done(handle_data)
      .fail(handle_data_error)
      .always(load_location_map);
  };

  // Code below executes on page load.

  // Activate all Retry buttons.
  $(".retry-button").on("click", function () {
    location.reload();
  });

  $("#message-loading").hide();

  // Passing in loc=accuracy/latitude/longitude in hash/search bypasses original behavior of geolocation on page load.
  // Note: the pattern is set up to accept a loc=latitude/longitude format due to a time period where it was optional.
  var loc_pattern = /[#&?]loc=(.*\/)?(.*)\/([^&]*)/;
  var handle_loc_hash = function () {
    $("#message-arcade-list").hide();
    if (loc_pattern.test(location.href)) {
      $("#message-setup").hide();
      var loc_params = loc_pattern.exec(location.href);
      handle_geolocation_ok({
        coords: {
          accuracy: Number((loc_params[1] || "").replace("/", "")),
          latitude: Number(loc_params[2]),
          longitude: Number(loc_params[3]),
        },
      });
    } else {
      $("#message-setup").show();
    }
  };

  // Passing in src=datasrc in hash/search bypasses original behavior of picking data source from localStorage on page load.
  var src_pattern = /[#&?]src=([^&]*)/;
  var handle_src_hash = function () {
    if (src_pattern.test(location.href)) {
      var src_param = src_pattern.exec(location.href);
      datasrc = src_param[1];
    }
  };

  // Combination hash handler, attach to hash change plus page load.
  var handle_hash = function () {
    handle_src_hash();
    handle_loc_hash();
  };
  if (!loc_pattern.test(location.href)) $("#message-setup").show();
  $(window).on("hashchange", handle_hash);
  handle_hash();

  const sourceSelect = $("#source-select");
  // Save selected source on click
  sourceSelect.on("change", function () {
    localStorage.setItem("datasrc", sourceSelect.val());
  });
  // Set current source as selected button
  sourceSelect.val(localStorage.getItem("datasrc") || "ziv");

  // If no loc=, use original behavior of calculating location and using localStorage for data source.
  $("#start-geolocation").on("click", function () {
    $("#message-setup").hide();
    datasrc = sourceSelect.val();
    // Geolocation feature detection from Modernizr
    if ("geolocation" in navigator) {
      $("#message-waiting").show();
      // Function explained in http://diveintohtml5.info/geolocation.html
      navigator.geolocation.getCurrentPosition(
        function (position) {
          // Trim to 4 digits, good for ~10m precision.
          location.hash = `#loc=${Math.max(
            10,
            Math.round(position.coords.accuracy),
          )}/${position.coords.latitude.toFixed(
            4,
          )}/${position.coords.longitude.toFixed(4)}&src=${datasrc}`;
        },
        handle_geolocation_error,
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000,
        },
      );
    } else {
      $("#message-nogeo").show();
    }
  });
});

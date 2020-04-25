/*! ddr-finder-ng | https://github.com/Andrew67/ddr-finder-ng */
/*
 Copyright (c) 2016-2020 Andrés Cordero

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

'use strict';

// Wait for ONS ready
ons.ready(function() {

    // These functions run on page load ASAP.

    // Polyfill for navigator.standalone which is iOS/Safari specific.
    if (typeof navigator.standalone === 'undefined') {
        navigator.standalone = window.matchMedia('(display-mode: standalone)').matches;
    }

    // Contains app navigator stack.
    var myNavigator = document.getElementById('myNavigator');

    // If iOS and standalone, add a class to allow for translucent status bar padding.
    if (ons.platform.isIOS() && navigator.standalone) {
        if (ons.platform.isIPhoneX()) {
            document.documentElement.setAttribute('onsflag-iphonex-portrait', '');
        } else {
            document.documentElement.setAttribute('iphone-portrait', '');
        }
    }
    if (ons.platform.isIPhoneX()) {
        // iPhoneX landscape padding makes sense regardless of standalone mode.
        document.documentElement.setAttribute('onsflag-iphonex-landscape', '');
    }
    // If Android, use navigator push and window pop to avoid back button exiting out of the app.
    // To avoid double-pop/push surrounding ons-back-button, provide a function that rewires them to use history.back().
    var enableAndroidBackButton = function () { };
    if (ons.platform.isAndroid()) {
        myNavigator.addEventListener('postpush', function (e) {
            // Prevent pushing on initial page load.
            if (e.navigator.pages.length > 1) {
                history.pushState({page: e.enterPage.id}, '');
            }
        });

        window.addEventListener('popstate', function () {
            myNavigator.popPage();
        });
        enableAndroidBackButton = function(pageid) {
            var backButton = document.querySelector('#' + pageid + ' ons-back-button');
            if (backButton !== null) {
                backButton.onClick = function () {
                    history.back();
                };
            }
        };
    }

    // End page load functions.

    // Track a goal with analytics, if available
    var trackGoal = function (goalId) {
        // Stub; awaiting new Analytics provider integration
    };

    // settingsService takes care of saving values in localStorage and retrieving casted/default values
    var settingsService = (function () {
        var module = {};
        var settings = {
            'datasource': {
                'key': 'datasrc',
                'type': 'string',
                'defaultValue': 'ziv'
            },
            'mapLastView': {
                'key': 'ng-map-last-view',
                'type': 'object',
                'defaultValue': { // Dallas, TX, US; zoomed-out default causes too much CPU stress on slower devices
                    center: {lat: 32.7157, lng: -96.8088},
                    zoom: 9
                }
            },
            'ios-navigation': {
                'key': 'ios-navigation',
                'type': 'string',
                'defaultValue': 'apple'
            }
        };

        module.setValue = function (key, newValue) {
            if (settings.hasOwnProperty(key)) {
                switch(settings[key].type) {
                    case 'object':
                        window.localStorage.setItem(settings[key].key, JSON.stringify(newValue));
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

                if (rawValue === null || rawValue === '') {
                    output = settings[key].defaultValue;
                }
                else {
                    switch (settings[key].type) {
                        case 'bool':
                            output = (rawValue === 'true');
                            break;
                        case 'object':
                            try {
                                output = JSON.parse(rawValue);
                            } catch (e) {
                                console.error('Error while extracting value for settings key: ' + key, e);
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

        // Unsets all user-defined settings
        module.clearAll = function () {
            for (var item in settings) {
                if (settings.hasOwnProperty(item)) {
                    window.localStorage.removeItem(settings[item].key);
                }
            }
        };

        // Clear old deprecated settings items from user's localStorage, to save space.
        ['ng-settings-datasource', 'ng-settings-custom-datasource', 'api-endpoint',
            'ng-settings-autoload', 'org.cubiq.addtohome', 'com.andrew67.ddrfinder.ng'].forEach(function (key) {
            window.localStorage.removeItem(key);
        });

        return module;
    })();

    // Enables clickable items (used mainly for Settings/About clickable list items)
    var enableExternalLinks = function(pageid) {
        var externalLinks = document.querySelectorAll('#' + pageid + ' [data-href]');
        for (var i = 0; i < externalLinks.length; ++i) {
            var link = externalLinks.item(i);
            link.addEventListener('click', (function () {
                openExternalLink(this.getAttribute('data-href'));
            }).bind(link));
        }
    };

    /* All-in-one suite for the DDR Finder API:
       Handles AJAX data load and parameter setting / unpacking the response.
       Keeps track of source metadata and provides helper methods to generate URLs or maps and more info.
       Keeps track of previously requested areas to help avoid unnecessary AJAX requests.
    */
    var apiService = (function () {
        var module = {}, loadedAreas = [/*mapboxgl.LngLatBounds*/], sources = {/*API response sources*/};
        var API_URL = '../locate.php';

        // Export error codes.
        module.ERROR = {
            UNEXPECTED: -1,
            DATASRC: 21,
            ZOOM: 23,
            DOS: 42
        };

        // Returns whether the given bounding box is covered by areas that have already been loaded.
        module.isLoaded = function (latLngBounds) {
            // Test all four corners (same algorithm as Android app's alreadyLoaded method in MapViewer class).
            var loadedNE = false, loadedSW = false, loadedNW = false, loadedSE = false;

            for (var i = 0; i < loadedAreas.length; ++i) {
                var bounds = loadedAreas[i];
                if (bounds.contains(latLngBounds.getNorthEast())) loadedNE = true;
                if (bounds.contains(latLngBounds.getSouthWest())) loadedSW = true;
                if (bounds.contains(latLngBounds.getNorthWest())) loadedNW = true;
                if (bounds.contains(latLngBounds.getSouthEast())) loadedSE = true;
                if (loadedNE && loadedSW && loadedNW && loadedSE) break;
            }

            return (loadedNE && loadedSW && loadedNW && loadedSE);
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
                return sources['fallback'];
            }
        };

        // Load arcade locations into the map.
        // If you want to potentially save a redundant AJAX request, call isLoaded first with these bounds.
        // The success callback receives the GeoJSON structure, and the error callback receives the error structure.
        module.getLocations = function (bounds, successcb, errorcb) {
            // Preload a slightly larger box area when zoomed in.
            if (Math.abs(bounds.getNorth() - bounds.getSouth()) < 0.5
                && Math.abs(bounds.getEast() - bounds.getWest()) < 0.5) {
                bounds = new mapboxgl.LngLatBounds(
                    [bounds.getWest() - 0.125, bounds.getSouth() - 0.125],
                    [bounds.getEast() + 0.125, bounds.getNorth() + 0.125]
                );
            }

            // Load settings regarding data source and API URL.
            var dataSource = settingsService.getValue('datasource');
            var url = API_URL + '?version=31&sourceformat=object&locationformat=geojson&canHandleLargeDataset&datasrc='
                        + encodeURIComponent(dataSource) + '&latlower=' + bounds.getSouth()
                        + '&lnglower=' + bounds.getWest() + '&latupper=' + bounds.getNorth()
                        + '&lngupper=' + bounds.getEast();

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
                        errorcb({ errorCode: -1, error: 'Unexpected XMLHttpRequest header (does the URL support CORS?)' });
                    }
                }
            };
            request.open('GET', url, true);
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            request.send(null);
        };

        return module;
    })();

    // Navigation URL generator functions and platform detection (originally from ddr-finder).
    var getNavURL = (function() {
        var getGoogleMapsURL = function (lat, lng, label) {
            return 'https://maps.google.com/?q=loc:' + lat + ',' + lng + '(' + encodeURIComponent(label) + ')';
        };

        if (ons.platform.isIOS())
            return function(latitude, longitude, label) {
            switch (settingsService.getValue('ios-navigation')) {
                case 'google':
                    return 'comgooglemaps://?daddr=' + latitude + ',' + longitude;
                case 'waze':
                    return 'waze://?ll=' + latitude + ',' + longitude + '&navigate=yes';
                case 'sygic':
                    return 'com.sygic.aura://coordinate|' + longitude + '|' + latitude + '|drive';
                case 'mapsme':
                    return 'mapswithme://map?v=1.1&ll=' + latitude + ',' + longitude + '&n=' + encodeURIComponent(label);
                case 'apple':
                default:
                    return 'maps:?q=&saddr=Current%20Location&daddr=loc:' + latitude + ',' + longitude;
            }
            };
        else if (ons.platform.isAndroid())
            return function(lat, lng, label) {
                // intent URI allows us to combine the following two:
                // geo URI that triggers app picker
                //     geo:lat,lng?q=lat,lng(encoded label)
                // Google Maps URI if no apps available to handle geo
                //     https://maps.google.com/?q=loc:lat,lng(encoded label)
                // See: https://developer.chrome.com/multidevice/android/intents
                return 'intent:' + lat + ',' + lng + '?q=' + lat + ',' + lng + '(' + encodeURIComponent(label) + ')' +
                        '#Intent;scheme=geo;' +
                        'S.browser_fallback_url=' + encodeURIComponent(getGoogleMapsURL(lat, lng, label)) + ';' +
                        'end;';
            };
        else return getGoogleMapsURL;
    })();

    // "More Info" URL function
    var getInfoURL = (function() {
        var infoProperty = 'infoURL';
        if (ons.platform.isAndroid() || ons.platform.isIOS()) infoProperty = 'mInfoURL';

        return function (location) {
            return apiService.getSource(location.src)[infoProperty]
                .replace('${id}', location.id).replace('${sid}', location.sid);
        }
    })();

    // Window open function for external links, which requires a workaround on iOS, as Safari requires <a href>.
    // From: http://stackoverflow.com/a/8833025
    // For non-http(s) links (app-trigger links), retains current context (avoids flash of a browser window before trigger).
    // intent URIs with fallback will also fire a window.open (except in standalone mode; as Chrome would jump to fallback),
    // otherwise it opens within the same application frame.
    var openExternalLink = function(href) {
        if (href.indexOf('http') === 0 ||
            (href.indexOf('intent') === 0 && href.indexOf('S.browser_fallback_url' > 0) && !navigator.standalone) ) {
            if (ons.platform.isIOS()) {
                var a = document.createElement('a');
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
        if ('URLSearchParams' in window && window.location.search) {
            var params = new URLSearchParams(window.location.search.substr(1));
            if (params.has('ll') && params.has('z')) {
                var ll = params.get('ll').split(',');
                return {
                    center: { lat: ll[0], lng: ll[1] },
                    zoom: params.get('z')
                };
            }
        }
        return settingsService.getValue('mapLastView');
    };

    // Each view exports certain functions, but contains its own scope

    // mapview
    var mapview = (function () {
        var module = {}, map;
        module.init = function (page) {
            // errorMsg can clear all errors or show a specific one, from the error-box div.
            var errorMsg = (function () {
                var module = {};
                var errorBox = document.getElementById('error-box');
                var errorMessages = errorBox.childNodes;

                module.clearAll = function () {
                    for (var i = 0; i < errorMessages.length; ++i) {
                        if (errorMessages.item(i).style) {
                            errorMessages.item(i).style.display = 'none';
                        }
                    }
                };

                module.show = function (msg) {
                    for (var i = 0; i < errorMessages.length; ++i) {
                        if (errorMessages.item(i).id === 'error-' + msg) {
                            errorMessages.item(i).style.display = '';
                            return;
                        }
                    }
                };

                return module;
            })();

            // Add "DDR Finder" branding header to Android in standalone mode (matches app).
            if (navigator.standalone) {
                var toolbar = document.createElement('ons-toolbar');
                var title = document.createElement('div');
                title.classList.add('center');
                title.textContent = 'DDR Finder';
                toolbar.appendChild(title);

                // If Web Share API is supported, insert a share button into the toolbar (shares current URL).
                // See: https://developers.google.com/web/updates/2016/09/navigator-share
                if ('share' in navigator) {
                    // See: https://onsen.io/v2/api/js/ons-toolbar-button.html
                    var shareButtonContainer = document.createElement('div');
                    shareButtonContainer.classList.add('right');

                    var shareButton = document.createElement('ons-toolbar-button');
                    shareButton.addEventListener('click', function () {
                        navigator.share({ url: window.location.href });
                    });

                    var shareButtonIcon = document.createElement('ons-icon');
                    shareButtonIcon.setAttribute('icon', 'ion-ios-share, material:ion-md-share');

                    shareButton.appendChild(shareButtonIcon);
                    shareButtonContainer.appendChild(shareButton);
                    toolbar.appendChild(shareButtonContainer);
                }

                page.insertBefore(toolbar, page.firstChild);
            }

            // Initialize map and set initial view.
            var initialView = getInitialView();
            mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kcmV3NjciLCJhIjoiY2lxMDlvOHZoMDAxOWZxbm9tdnR1NjVubSJ9.35GV_5ZM6zS2R5KQCwBWqw';
            map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [initialView.center.lng, initialView.center.lat],
                zoom: initialView.zoom,
                renderWorldCopies: false
            });

            var geocoder = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                mapboxgl: mapboxgl,
                marker: false,
                // On iOS standalone, expanding the collapsed search is a bit tricky, so disabling collapse instead
                collapsed: !(ons.platform.isIOS() && navigator.standalone),
                clearAndBlurOnEsc: true,
                flyTo: {
                    animate: false
                },
                // On iOS standalone, OnsenUI's FastClick does not play well with the Geocoder,
                // so we override the render method to insert the needsclick class which excludes results from FastClick
                render: function (item) {
                    var placeName = item.place_name.split(',');
                    return '<div class="mapboxgl-ctrl-geocoder--suggestion"><div class="mapboxgl-ctrl-geocoder--suggestion-title needsclick">'
                        + placeName[0] + '</div><div class="mapboxgl-ctrl-geocoder--suggestion-address needsclick">'
                        + placeName.splice(1, placeName.length).join(',') + '</div></div>';
                }
            });
            // Dismiss the soft keyboard on mobile devices upon selecting a result
            geocoder.on('result', function () { document.activeElement.blur(); });
            map.addControl(geocoder);

            // Add zoom/bearing controls to map.
            map.addControl(new mapboxgl.NavigationControl());

            // My Location control button
            map.addControl(
                new mapboxgl.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: true
                    },
                    trackUserLocation: true
                })
            );

            // Custom actions (refresh, settings, Android app, etc.)
            // See: https://docs.mapbox.com/mapbox-gl-js/api/#icontrol
            function MyControl() { }
            MyControl.prototype.onAdd = function () {
                this._container = document.createElement('div');
                this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

                // Reload
                var reloadButton = this.getButton('Reload', 'ion-ios-refresh, material:ion-md-refresh');
                reloadButton.addEventListener('click', function () {
                    dataLoadHandler(null, true);
                });
                this._container.appendChild(reloadButton);

                // Settings
                var settingsButton = this.getButton('Settings', 'ion-ios-settings, material:ion-md-settings');
                settingsButton.addEventListener('click', function () {
                    myNavigator.pushPage('settings.html');
                });
                this._container.appendChild(settingsButton);

                // Open Android App
                if (ons.platform.isAndroid()) {
                    var openInAppButton = this.getButton('Open in App', 'ion-md-apps');
                    openInAppButton.addEventListener('click', function () {
                        openExternalLink('intent://ddrfinder.andrew67.com/ng' +
                            (window.location.search ? window.location.search : '') +
                            '#Intent;package=com.andrew67.ddrfinder;scheme=https;end');
                    });
                    this._container.appendChild(openInAppButton);
                }

                return this._container;
            }
            MyControl.prototype.onRemove = function () {
                this._container.parentNode.removeChild(this._container);
            }
            MyControl.prototype.getButton = function (title, icon) {
                var button = document.createElement('button');
                button.className = 'mapboxgl-ctrl-ons';
                button.setAttribute('title', title);
                button.setAttribute('aria-label', title);
                var iconEl = document.createElement('ons-icon');
                iconEl.setAttribute('icon', icon);
                iconEl.setAttribute('aria-hidden', 'true');
                button.appendChild(iconEl);
                return button;
            }
            map.addControl(new MyControl());

            // More Info / Navigate action handlers for locations.
            var onMoreInfo = function (feature) {
                trackGoal(5);
                openExternalLink(getInfoURL(feature.properties));
            };
            var onNavigate = function (feature) {
                trackGoal(3);

                // If iOS standalone and non-default map application, detect missing app and offer to switch to Apple Maps and retry.
                if (ons.platform.isIOS() && navigator.standalone && settingsService.getValue('ios-navigation') !== 'apple') {
                    setTimeout(function () {
                        ons.notification.confirm('Unable to launch your selected navigation app. Switch to Apple Maps?')
                            .then(function(answer) {
                                if (answer === 1) {
                                    settingsService.setValue('ios-navigation', 'apple');
                                    onNavigate(feature);
                                }
                            });
                    }, 1000);
                }

                openExternalLink(getNavURL(feature.geometry.coordinates[1],
                    feature.geometry.coordinates[0], feature.properties.name));
            };

            // This function is called when an arcade location on the map is clicked.
            var buildPopupDOM = function (feature) {
                var popupContainer = document.createElement('div');

                var description = document.createElement('div');
                var descriptionHTML = '<p><b class="selectable">' + feature.properties.name + '</b><br>';
                if (feature.properties.city.length !== 0) {
                    descriptionHTML += '<i>City</i>: <span class="selectable">' + feature.properties.city + '</span><br>';
                }
                descriptionHTML += '<i>GPS</i>: <span class="selectable">' + feature.geometry.coordinates[1].toFixed(5)
                    + '°, ' + feature.geometry.coordinates[0].toFixed(5) + '°</span></p>';
                description.innerHTML = descriptionHTML;

                var moreInfo = document.createElement('ons-button');
                moreInfo.textContent = 'More Info';
                moreInfo.setAttribute('modifier', 'quiet');
                moreInfo.addEventListener('click', function () {
                    onMoreInfo(feature);
                });

                var navigate = document.createElement('ons-button');
                navigate.textContent = 'Navigate';
                navigate.addEventListener('click', function () {
                    onNavigate(feature);
                });

                popupContainer.appendChild(description);
                popupContainer.appendChild(moreInfo);
                popupContainer.appendChild(navigate);
                return popupContainer;
            };

            // Takes care of loading and attaching GeoJSON data from API when map dragend/zoomend is fired, etc.
            // Clears and sets errors when necessary as well.
            var loadedLocationIds = []; // Stores loaded location ids, to prevent loading duplicate markers on the map.
            var dataLoadHandler = function (event, forceLoad) {
                errorMsg.clearAll();

                if (!apiService.isLoaded(map.getBounds()) || forceLoad) {
                    // TODO: spin up indeterminate progress bar

                    var commonCleanup = function() {
                        // TODO: hide progress bar
                    };

                    apiService.getLocations(map.getBounds(), function (locations) {
                        commonCleanup();

                        // Filter already loaded locations from the features list before (re)adding to map.
                        locations.features = locations.features.filter(function (location) {
                            if (loadedLocationIds.indexOf(location.properties.id) === -1) {
                                loadedLocationIds.push(location.properties.id);
                                return true;
                            }
                            return false;
                        });

                        // Create or update the GeoJSON locations layer with the incoming data.
                        var source = map.getSource('locations');
                        if (!source) {
                            map.addSource('locations', {
                                type: 'geojson',
                                // TODO: Show only attribution for selected data source
                                attribution: '&copy; Zenius -I- vanisher.com &copy; DDR-Navi',
                                data: locations,
                                cluster: true,
                                clusterMaxZoom: 14
                            });
                        } else {
                            source.setData({
                                type: source._data.type,
                                features: source._data.features.concat(locations.features)
                            });
                        }
                        // See: https://docs.mapbox.com/mapbox-gl-js/example/cluster/
                        if (!map.getLayer('clusters')) {
                            map.addLayer({
                                id: 'clusters',
                                type: 'circle',
                                source: 'locations',
                                filter: ['has', 'point_count'],
                                paint: {
                                    // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
                                    // with three steps to implement three types of circles:
                                    //   * Blue, 20px circles when point count is less than 100
                                    //   * Yellow, 30px circles when point count is between 100 and 750
                                    //   * Pink, 40px circles when point count is greater than or equal to 750
                                    // TODO: Proper app-theme colors
                                    'circle-color': [
                                        'step',
                                        ['get', 'point_count'],
                                        '#51bbd6',
                                        100,
                                        '#f1f075',
                                        750,
                                        '#f28cb1'
                                    ],
                                    'circle-radius': [
                                        'step',
                                        ['get', 'point_count'],
                                        20,
                                        100,
                                        30,
                                        750,
                                        40
                                    ]
                                }
                            });

                            map.addLayer({
                                id: 'cluster-count',
                                type: 'symbol',
                                source: 'locations',
                                filter: ['has', 'point_count'],
                                layout: {
                                    'text-field': '{point_count_abbreviated}',
                                    //'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                                    'text-size': 12
                                }
                            });

                            map.addLayer({
                                id: 'unclustered-point',
                                type: 'symbol',
                                source: 'locations',
                                filter: ['!', ['has', 'point_count']],
                                layout: {
                                    // TODO: proper large marker icon
                                    // TODO: dynamic icon based on DDR status
                                    'icon-image': 'music-15',
                                    'icon-allow-overlap': true,
                                    'text-field': ['get', 'name'],
                                    'text-size': 14,
                                    'text-offset': [0, 0.6],
                                    'text-anchor': 'top',
                                    'text-allow-overlap': true
                                },
                                paint: {
                                    'text-color': '#1976d2',
                                    'text-halo-color': '#ffffff',
                                    'text-halo-width': 2
                                }
                            });

                            // inspect a cluster on click
                            map.on('click', 'clusters', function(e) {
                                var features = map.queryRenderedFeatures(e.point, {
                                    layers: ['clusters']
                                });
                                var clusterId = features[0].properties.cluster_id;
                                map.getSource('locations').getClusterExpansionZoom(
                                    clusterId,
                                    function(err, zoom) {
                                        if (err) return;

                                        map.easeTo({
                                            center: features[0].geometry.coordinates,
                                            zoom: zoom
                                        });
                                    }
                                );
                            });
                            map.on('mouseenter', 'clusters', function() {
                                map.getCanvas().style.cursor = 'pointer';
                            });
                            map.on('mouseleave', 'clusters', function() {
                                map.getCanvas().style.cursor = '';
                            });

                            // When a click event occurs on a feature in
                            // the unclustered-point layer, open a popup at
                            // the location of the feature, with
                            // description HTML from its properties.
                            map.on('click', 'unclustered-point', function(e) {

                                var feature = e.features[0];
                                var coordinates = feature.geometry.coordinates.slice();
                                var properties = feature.properties;

                                // Ensure that if the map is zoomed out such that
                                // multiple copies of the feature are visible, the
                                // popup appears over the copy being pointed to.
                                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                                }

                                new mapboxgl.Popup()
                                    .setLngLat(coordinates)
                                    .setDOMContent(buildPopupDOM(feature))
                                    .addTo(map);
                                console.log(properties);
                            });
                            map.on('mouseenter', 'unclustered-point', function() {
                                map.getCanvas().style.cursor = 'pointer';
                            });
                            map.on('mouseleave', 'unclustered-point', function() {
                                map.getCanvas().style.cursor = '';
                            });
                        }
                    }, function (error) {
                        commonCleanup();

                        switch (error.errorCode) {
                            case apiService.ERROR.ZOOM:
                                errorMsg.show('zoom');
                                break;
                            case apiService.ERROR.DATASRC:
                                errorMsg.show('datasrc');
                                break;
                            default:
                                errorMsg.show('unexpected');
                                console.error(error);
                                break;
                        }
                    });
                }
            };
            map.on('dragend', dataLoadHandler);
            map.on('zoomend', dataLoadHandler);
            map.on('locationfound', dataLoadHandler);

            // Store current map view (center/zoom) after user action in order to return to it on re-init/share.
            var lastViewPreserver = function () {
                var center = map.getCenter();
                var zoom = map.getZoom();
                settingsService.setValue('mapLastView', {
                    center: {lat: center.lat, lng: center.lng},
                    zoom: zoom
                });
                history.replaceState({}, '', '?ll=' + center.lat.toFixed(5) + ','
                    + center.lng.toFixed(5) + '&z=' + zoom.toFixed(0));
            };
            map.on('dragend', lastViewPreserver);
            map.on('zoomend', lastViewPreserver);
            map.on('locationfound', lastViewPreserver);

            // Load on mapview init.
            apiService.clear();
            map.on('load', dataLoadHandler);
            lastViewPreserver();
        };

        module.show = function () {
            // Trigger resize on the map when returning to the map page.
            // This is used to handle the following case:
            // Navigating to Settings/About and visiting an external link, then returning to the webapp causes the map
            // to resize itself, however since the map page is `display: none` at that time, it considers the height
            // as 0 and falls back to a 300px height, without ever re-assessing.
            // See: https://github.com/mapbox/mapbox-gl-js/issues/3265
            if (map) map.resize();
        };

        return module;
    })();

    // settings
    var settings = (function () {
        var module = {};
        // Extract the label for a given multi select value
        var setLabel = function (id, value) {
            document.querySelector('#settings-' + id + ' .list-item__subtitle').textContent =
                document.querySelector('label[for=settings-' + id + '-' + value + ']').textContent.trim();
        };

        // React to onChange events on the form and save the values in localStorage.
        var formChangeHandler = function (e) {
            var option = e.target;
            var key = null;
            var newValue = null;

            switch (option.name) {
                case 'datasource':
                case 'ios-navigation':
                    key = option.name;
                    newValue = option.id.replace('settings-' + key + '-', '');

                    // Update UI label and hide the dialog
                    document.getElementById('settings-' + key + '-dialog').hide();
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
            document.getElementById('about-button').addEventListener('click', function () {
                myNavigator.pushPage('about.html');
            });

            page.addEventListener('change', formChangeHandler);

            // Set the dialog listeners and initialize label and radio buttons to the current values
            var dialogs = ['datasource'];
            if (ons.platform.isIOS()) dialogs.push('ios-navigation');

            dialogs.forEach(function (key) {
                var dialog = document.getElementById('settings-' + key + '-dialog');
                document.getElementById('settings-' + key).addEventListener('click', function () {
                    dialog.show();
                });
                document.getElementById('settings-' + key + '-cancel').addEventListener('click', function () {
                    dialog.hide();
                });
                var currentValue = settingsService.getValue(key);
                setLabel(key, currentValue);
                document.getElementById('settings-' + key + '-' + currentValue).checked = true;
            });

            // Set settings to factory default after confirming with user, then kick out of settings screen
            document.getElementById('settings-factory').addEventListener('click', function() {
                ons.notification.confirm('Are you sure? This will erase all of your settings.')
                .then(function(answer) {
                    if (answer === 1) {
                        settingsService.clearAll();
                        myNavigator.popPage();
                    }
                });
            });
        };

        return module;
    })();

    // about
    var about = (function () {
        var module = {};
        module.init = function () {
        };
        return module;
    })();

    document.addEventListener('init', function (e) {
        var page = e.target;

        enableExternalLinks(page.id);
        enableAndroidBackButton(page.id);

        if (page.id === 'mapview') mapview.init(page);
        else if (page.id === 'settings') settings.init(page);
        else if (page.id === 'about') about.init(page);
    });

    document.addEventListener('show', function (e) {
        var page = e.target;

        if (page.id === 'mapview') mapview.show(page);
    });
});
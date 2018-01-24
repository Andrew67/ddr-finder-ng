/*! ddr-finder-ng | https://github.com/Andrew67/ddr-finder-ng */
/*
 Copyright (c) 2016-2017 Andrés Cordero

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

    // If iOS and standalone, add a class to allow for translucent status bar padding, among other things.
    if (ons.platform.isIOS() && navigator.standalone) {
        document.body.classList.add('ios-standalone');

        // Confirm that screen height == innerHeight to mark as translucent status bar.
        // Otherwise, there is a bar obstructing us (in-call, navigation in-use).
        // Furthermore, detect and work around the iOS positioning bug (bottom 20px cut off).
        // Call on page init then on resize events.
        var translucentStatusBarDetector = function () {
            document.body.classList.remove('ios-translucent-statusbar');
            document.body.classList.remove('ios-webview-bug');

            if (screen.height === window.innerHeight || screen.width === window.innerHeight) {
                if (screen.availHeight === screen.height - 20) {
                    // These are our ideal parameters. Portrait enforcement is done via CSS media query.
                    document.body.classList.add('ios-translucent-statusbar');
                } else {
                    // This condition triggers when opening the app with a 40px header present.
                    document.body.classList.add('ios-webview-bug');
                }
            } else if (screen.availHeight === window.innerHeight) {
                // This condition triggers when re-toggling a 40px header after opening the app with a 40px header present.
                document.body.classList.add('ios-webview-bug');
            }
        };
        translucentStatusBarDetector();
        window.addEventListener('resize', translucentStatusBarDetector);
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
        var module = {}, loadedAreas = [/*L.latLngBounds*/], sources = {/*API response sources*/};
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
                bounds = L.latLngBounds(
                    [bounds.getSouth() - 0.125, bounds.getWest() - 0.125],
                    [bounds.getNorth() + 0.125, bounds.getEast() + 0.125]
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
        var module = {};
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
            if (ons.platform.isAndroid() && navigator.standalone) {
                var toolbar = document.createElement('ons-toolbar');
                var title = document.createElement('div');
                title.classList.add('center');
                title.textContent = 'DDR Finder';
                toolbar.appendChild(title);
                page.insertBefore(toolbar, page.firstChild);
            }

            // Initialize map and set initial view.
            var initialView = getInitialView();
            var map = L.map('map', {
                center: [initialView.center.lat, initialView.center.lng],
                zoom: initialView.zoom,
                worldCopyJump: true
            });

            // Detect hiDPI displays and append @2x modifier for larger tiles
            var tileLayerURL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}{r}?access_token={accessToken}'
                .replace('{r}', (window.devicePixelRatio > 1) ? '@2x' : '');

            L.tileLayer(tileLayerURL, {
                attribution: 'Imagery from <a href="http://mapbox.com/about/maps/">MapBox</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                subdomains: 'abcd',
                accessToken: 'pk.eyJ1IjoiYW5kcmV3NjciLCJhIjoiY2lxMDlvOHZoMDAxOWZxbm9tdnR1NjVubSJ9.35GV_5ZM6zS2R5KQCwBWqw'
            }).addTo(map);

            // My Location control button (attached to Zoom controls via CSS)
            L.control.locate({
                flyTo: true,
                locateOptions: {
                    maxZoom: 12
            }}).addTo(map);

            // Add controls to map.

            // Action bar contains actions like refresh.
            // Activity bar contains buttons that open other activities (settings, Android app, etc).
            var actionBar = [], activityBar = [];

            // L.easyButton wrapper that sets tagName to a to match leaflet buttons, and exposes title attribute.
            var myEasyButton = function (icon, title, onClick) {
                return L.easyButton({
                    states:[{
                        onClick: onClick,
                        icon: icon,
                        title: title
                    }],
                    tagName: 'a'
                });
            };

            // Reload
            var reloadButton = L.easyButton({
                states:[
                    {
                        stateName: 'ready',
                        onClick: function () {
                            dataLoadHandler(null, true);
                        },
                        icon: 'fa-refresh',
                        title: 'Reload'
                    },
                    {
                        stateName: 'loading',
                        icon: 'fa-spinner fa-spin',
                        title: 'Loading...'
                    }
                ],
                tagName: 'a'
            });
            actionBar.push(reloadButton);

            // Settings
            activityBar.push(myEasyButton('fa-sliders', 'Settings', function () {
                myNavigator.pushPage('settings.html');
            }));

            // Open Android App
            if (ons.platform.isAndroid()) {
                activityBar.push(myEasyButton('fa-android', 'Open Android App', function () {
                    openExternalLink('intent://ddrfinder.andrew67.com/ng' +
                        (window.location.search ? window.location.search : '') +
                        '#Intent;package=com.andrew67.ddrfinder;scheme=https;end');
                }));
            }

            L.easyBar(actionBar).addTo(map);
            L.easyBar(activityBar).addTo(map);

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

            // This function is called for every arcade location loaded onto the map.
            var onEachFeature = function (feature, layer) {
                var popupContainer = document.createElement('div');

                var description = document.createElement('div');
                var descriptionHTML = '<p><b class="selectable">' + feature.properties.name + '</b><br>';
                if (feature.properties.city.length !== 0) {
                    descriptionHTML += feature.properties.city + '<br>';
                }
                descriptionHTML += '<i>GPS</i>: <span class="selectable">' + feature.geometry.coordinates[1].toFixed(6)
                    + '°, ' + feature.geometry.coordinates[0].toFixed(6) + '°</span></p>';
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

                layer.bindPopup(popupContainer);
            };

            // Initialize the marker cluster.
            var markers = L.markerClusterGroup();
            map.addLayer(markers);

            // Set attribution link targets to new window
            var attributionLinks = document.querySelectorAll('.leaflet-control-attribution a');
            for (var i = 0; i < attributionLinks.length; ++i) {
                attributionLinks.item(i).setAttribute('target', '_blank');
            }

            // Takes care of loading and attaching GeoJSON data from API when map dragend/zoomend is fired, etc.
            // Clears and sets errors when necessary as well.
            var loadedLocationIds = []; // Stores loaded location ids, to prevent loading duplicate markers on the map.
            var dataLoadHandler = function (event, forceLoad) {
                errorMsg.clearAll();

                if (!apiService.isLoaded(map.getBounds()) || forceLoad) {
                    reloadButton.state('loading');

                    var commonCleanup = function() {
                        reloadButton.state('ready');
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

                        // Create a new GeoJSON layer that parses the new locations, then add them to the marker cluster.
                        L.geoJson(locations, {
                            onEachFeature: onEachFeature
                        }).addTo(markers);
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

            // Load on mapview init.
            apiService.clear();
            dataLoadHandler(null);

            // Store current map view (center/zoom) after user action in order to return to it on re-init/share.
            var lastViewPreserver = function () {
                var center = map.getCenter();
                var zoom = map.getZoom();
                settingsService.setValue('mapLastView', {
                    center: {lat: center.lat, lng: center.lng},
                    zoom: zoom
                });
                history.replaceState({}, '', '?ll=' + center.lat.toFixed(6) + ',' + center.lng.toFixed(6) + '&z=' + zoom);
            };
            map.on('dragend', lastViewPreserver);
            map.on('zoomend', lastViewPreserver);
            map.on('locationfound', lastViewPreserver);
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
});
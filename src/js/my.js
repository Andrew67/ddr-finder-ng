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

// Wait for DOM loaded
document.addEventListener('DOMContentLoaded', function() {

    // These functions run on page load ASAP.

    // Polyfill for navigator.standalone which is iOS/Safari specific.
    if (typeof navigator.standalone === 'undefined') {
        navigator.standalone = (window.location.search.indexOf('mode=standalone') >= 0);
    }

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

            if (screen.height == window.innerHeight || screen.width == window.innerHeight) {
                if (screen.availHeight == screen.height - 20) {
                    // These are our ideal parameters. Portrait enforcement is done via CSS media query.
                    document.body.classList.add('ios-translucent-statusbar');
                } else {
                    // This condition triggers when opening the app with a 40px header present.
                    document.body.classList.add('ios-webview-bug');
                }
            } else if (screen.availHeight == window.innerHeight) {
                // This condition triggers when re-toggling a 40px header after opening the app with a 40px header present.
                document.body.classList.add('ios-webview-bug');
            }
        };
        translucentStatusBarDetector();
        window.addEventListener('resize', translucentStatusBarDetector);
    }

    // End page load functions.

    // Useful shorthand variables
    var myNavigator = document.getElementById('myNavigator');

    // Track a goal with Piwik analytics, if available
    var trackGoal = function (goalId) {
        if (_paq && _paq.push) _paq.push(['trackGoal', goalId]);
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
                'defaultValue': {
                    center: {lat: 36.2068047, lng: -100.7467658},
                    zoom: 4
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
            'ng-settings-autoload', 'org.cubiq.addtohome'].forEach(function (key) {
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
            return function(latitude, longitude, label) {
                return 'geo:' + latitude + ',' + longitude + '?q=' + latitude + ',' + longitude + '(' + encodeURIComponent(label) + ')';
            };
        return function(latitude, longitude, label) {
            return 'https://maps.google.com/?q=loc:' + latitude + ',' + longitude + '(' + encodeURIComponent(label) + ')';
        };
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
    var openExternalLink = function(href) {
        if (href.indexOf('http') === 0) {
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

    // Each view exports certain functions, but contains its own scope

    // mapview
    var mapview = (function () {
        var module = {};
        module.init = function () {
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
                        if (errorMessages.item(i).id == 'error-' + msg) {
                            errorMessages.item(i).style.display = '';
                            return;
                        }
                    }
                };

                return module;
            })();

            // Initialize map and set view to last view recorded.
            var lastView = settingsService.getValue('mapLastView');
            var map = L.map('map', {
                center: [lastView.center.lat, lastView.center.lng],
                zoom: lastView.zoom,
                worldCopyJump: true
            });

            // Detect retina displays and append @2x modifier for larger tiles
            var tileLayerURL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}{r}?access_token={accessToken}'
                .replace('{r}', (window.devicePixelRatio > 1) ? '@2x' : '');

            L.tileLayer(tileLayerURL, {
                attribution: 'Imagery from <a href="http://mapbox.com/about/maps/">MapBox</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                subdomains: 'abcd',
                accessToken: 'pk.eyJ1IjoiYW5kcmV3NjciLCJhIjoiY2lxMDlvOHZoMDAxOWZxbm9tdnR1NjVubSJ9.35GV_5ZM6zS2R5KQCwBWqw'
            }).addTo(map);

            // Add controls to map.

            // My Location control button
            L.control.locate({
                locateOptions: {
                    maxZoom: 12
            }}).addTo(map);

            // Loading indicator
            var loadingControl = L.Control.loading({
                separate: true,
                position: 'topright'
            });
            map.addControl(loadingControl);

            // Settings, refresh, etc.
            L.easyButton('fa-sliders fa-lg', function () {
                myNavigator.pushPage('settings.html');
            }).addTo(map);

            var reloadButton = L.easyButton('fa-refresh fa-lg', function () {
                dataLoadHandler(null, true);
            });
            reloadButton.addTo(map);

            if (ons.platform.isAndroid()) {
                L.easyButton('fa-android fa-lg', function () {
                    openExternalLink('intent://com.andrew67.ddrfinder/view#Intent;package=com.andrew67.ddrfinder;scheme=content;end');
                }).addTo(map);
            }

            // This function is called for every arcade location loaded onto the map.
            var onEachFeature = function (feature, layer) {
                var popupContainer = document.createElement('div');

                var description = document.createElement('div');
                var descriptionHTML = '<p><b class="selectable">' + feature.properties.name + '</b><br>';
                if (feature.properties.city.length != 0) {
                    descriptionHTML += feature.properties.city + '<br>';
                }
                descriptionHTML += '<i>GPS</i>: <span class="selectable">' + feature.geometry.coordinates[1].toFixed(6)
                    + '°, ' + feature.geometry.coordinates[0].toFixed(6) + '°</span></p>';
                description.innerHTML = descriptionHTML;

                var moreInfo = document.createElement('ons-button');
                moreInfo.textContent = 'More Info';
                moreInfo.setAttribute('modifier', 'quiet');
                moreInfo.addEventListener('click', function () {
                    trackGoal(5);
                    openExternalLink(getInfoURL(feature.properties));
                });

                var navigate = document.createElement('ons-button');
                navigate.textContent = 'Navigate';
                navigate.addEventListener('click', function () {
                    trackGoal(3);
                    openExternalLink(getNavURL(feature.geometry.coordinates[1],
                        feature.geometry.coordinates[0], feature.properties.name));
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
                    map.fireEvent('dataloading', event);
                    reloadButton.disable();

                    var commonCleanup = function() {
                        map.fireEvent('dataload', event);
                        reloadButton.enable();
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

            // Store current map view (center/zoom) after user action in order to return to it on re-init.
            var lastViewPreserver = function () {
                var center = map.getCenter();
                settingsService.setValue('mapLastView', {
                    center: {lat: center.lat, lng: center.lng},
                    zoom: map.getZoom()
                });
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
            document.querySelector('#settings-' + id + ' .list__item__subtitle').textContent =
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
                })
            })
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

        if (page.id === 'mapview') mapview.init(page);
        else if (page.id === 'settings') settings.init(page);
        else if (page.id === 'about') about.init(page);
    });
});
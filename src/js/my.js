/*! ddr-finder-ng | https://github.com/Andrew67/ddr-finder-ng */
/*
 Copyright (c) 2016 Andrés Cordero

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

    // Useful shorthand variables
    var myNavigator = document.getElementById('myNavigator');

    // settingsService takes care of saving values in localStorage and retrieving casted/default values
    var settingsService = (function () {
        var module = {};
        var settings = {
            'autoload': {
                'key': 'ng-settings-autoload',
                'type': 'bool',
                'defaultValue': true
            },
            'datasource': {
                'key': 'ng-settings-datasource',
                'type': 'string',
                'defaultValue': 'ziv'
            },
            'custom-datasource': {
                'key': 'ng-settings-custom-datasource',
                'type': 'string',
                'defaultValue': 'all'
            },
            'api-endpoint': {
                'key': 'ng-settings-api-endpoint',
                'type': 'string',
                'defaultValue': 'https://andrew67.ddrfinder.com/locate.php'
            }
        };

        module.setValue = function (key, newValue) {
            if (settings.hasOwnProperty(key)) {
                window.localStorage.setItem(settings[key].key, newValue);

                // Backwards compatibility with the options selector on the DDR finder home page, when on same domain
                if (key === 'datasource' && (newValue === 'ziv' || newValue === 'navi')) {
                    window.localStorage.setItem('datasrc', newValue);
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
                    // Backwards compatibility with the options selector on the DDR finder home page
                    // when on same domain and setting has not been toggled here (usually first-run)
                    if (key === 'datasource') {
                        var datasrc = window.localStorage.getItem('datasrc');
                        if (datasrc === null || datasrc === '') {
                            output = settings['datasource'].defaultValue;
                        } else {
                            output = datasrc;
                        }
                    }
                    else {
                        output = settings[key].defaultValue;
                    }
                }
                else {
                    switch(settings[key].type) {
                        case 'bool':
                            output = (rawValue === 'true');
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
                //noinspection JSUnfilteredForInLoop
                window.localStorage.removeItem(settings[item].key);
            }
        };

        return module;
    })();

    // Enables clickable items (used mainly for Settings/About clickable list items)
    var enableExternalLinks = function(pageid) {
        var externalLinks = document.querySelectorAll('#' + pageid + ' [data-href]');
        for (var i = 0; i < externalLinks.length; ++i) {
            var link = externalLinks.item(i);
            link.addEventListener('click', (function () {
                openWindow(this.getAttribute('data-href'));
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
            if (dataSource == 'custom') dataSource = settingsService.getValue('custom-datasource');
            var apiUrl = settingsService.getValue('api-endpoint');
            var url = apiUrl + '?version=31&sourceformat=object&locationformat=geojson&datasrc='
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

    // Navigation URL generator functions and platform detection (from ddr-finder).
    var navURLHelpers = {
        generic: function(latitude, longitude, label) {
            return 'https://maps.google.com/?q=loc:' + latitude + ',' + longitude + '(' + encodeURI(label) + ')';
        },
        android: function(latitude, longitude, label) {
            return 'geo:' + latitude + ',' + longitude + '?q=' + latitude + ',' + longitude + '(' + encodeURI(label) + ')';
        },
        ios: function(latitude, longitude, label) {
            return 'maps:?q=&saddr=Current%20Location&daddr=loc:' + latitude + ',' + longitude + '(' + encodeURI(label) + ')';
        }
    };

    var getNavURL = navURLHelpers.generic;
    if (ons.platform.isAndroid()) getNavURL = navURLHelpers.android;
    else if (ons.platform.isIOS()) getNavURL = navURLHelpers.ios;

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
    var openWindow = (function() {
        if (ons.platform.isIOS()) {
            return function (href) {
                var a = document.createElement('a');
                a.setAttribute("href", href);
                a.setAttribute("target", "_blank");

                var dispatch = document.createEvent("HTMLEvents");
                dispatch.initEvent("click", true, true);
                a.dispatchEvent(dispatch);
            };
        } else {
            return window.open;
        }
    })();

    // Each view exports certain functions, but contains its own scope

    // mapview
    var mapview = (function () {
        var module = {};
        module.init = function () {
            document.getElementById('settings-button').addEventListener('click', function () {
                myNavigator.pushPage('settings.html');
            });

            var reloadButton = document.getElementById('reload-button');

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

            // Initialize map and set view to US, zoomed out.
            var map = L.map('map', {
                center: [36.2068047, -100.7467658],
                zoom: 4,
                worldCopyJump: true
            });

            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                attribution: 'Imagery from <a href="http://mapbox.com/about/maps/">MapBox</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                subdomains: 'abcd',
                id: 'mapbox.streets-basic',
                accessToken: 'pk.eyJ1IjoiYW5kcmV3NjciLCJhIjoiY2lxMDlvOHZoMDAxOWZxbm9tdnR1NjVubSJ9.35GV_5ZM6zS2R5KQCwBWqw'
            }).addTo(map);

            L.control.locate({
                locateOptions: {
                    maxZoom: 12
            }}).addTo(map);

            var loadingControl = L.Control.loading({
                separate: true,
                position: 'topright'
            });
            map.addControl(loadingControl);

            var geoJson = L.geoJson(null, {
                onEachFeature: function (feature, layer) {
                    var popupContainer = document.createElement('div');

                    var description = document.createElement('div');
                    var descriptionHTML = '<b>' + feature.properties.name + '</b><br>';
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
                        openWindow(getInfoURL(feature.properties));
                    });

                    var navigate = document.createElement('ons-button');
                    navigate.textContent = 'Navigate';
                    navigate.addEventListener('click', function () {
                        var navURL = getNavURL(feature.geometry.coordinates[1],
                            feature.geometry.coordinates[0], feature.properties.name);
                        if (ons.platform.isAndroid() || ons.platform.isIOS()) {
                            window.location = navURL; // avoid popping up a browser window before app triggers
                        } else {
                            openWindow(navURL);
                        }
                    });

                    popupContainer.appendChild(description);
                    popupContainer.appendChild(moreInfo);
                    popupContainer.appendChild(navigate);

                    layer.bindPopup(popupContainer);
                }
            }).addTo(map);

            // Set attribution link targets to new window
            var attributionLinks = document.querySelectorAll('.leaflet-control-attribution a');
            for (var i = 0; i < attributionLinks.length; ++i) {
                attributionLinks.item(i).setAttribute('target', '_blank');
            }

            // Takes care of loading and attaching GeoJSON data from API when map dragend/zoomend is fired, etc.
            // Clears and sets errors when necessary as well.
            var dataLoadHandler = function (event, forceLoad) {
                if (!apiService.isLoaded(map.getBounds()) &&
                    (forceLoad || settingsService.getValue('autoload'))) {
                    map.fireEvent('dataloading', event);
                    reloadButton.style.display = 'none';

                    var commonCleanup = function() {
                        map.fireEvent('dataload', event);
                        reloadButton.style.display = '';
                        errorMsg.clearAll();
                    };

                    apiService.getLocations(map.getBounds(), function (locations) {
                        commonCleanup();
                        geoJson.addData(locations);
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

            // Load on mapview init.
            apiService.clear();
            dataLoadHandler(null);

            // Reload button forces data load
            reloadButton.addEventListener('click', function(e) {
                dataLoadHandler(e, true);
            });
        };

        return module;
    })();

    // settings
    var settings = (function () {
        var module = {};
        // Extract the label for a given data source value
        var setDataSourceLabel = function (value) {
            document.querySelector('#settings-datasource .list__item__subtitle').textContent =
                document.querySelector('label[for=settings-datasource-' + value + ']').textContent.trim();
        };

        // React to onChange events on the form and save the values in localStorage.
        var formChangeHandler = function (e) {
            var option = e.target;
            var key = null;
            var newValue = null;

            switch (option.id) {
                case 'settings-autoload':
                    key = 'autoload';
                    newValue = option.checked;
                    break;
                default:
                    break;
            }
            switch (option.name) {
                case 'datasource':
                    key = 'datasource';
                    newValue = option.id.replace('settings-datasource-', '');

                    // Update UI label and hide the data source dialog
                    document.getElementById('settings-datasource-dialog').hide();
                    setDataSourceLabel(newValue);
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
            enableExternalLinks('settings');

            // Initialize the autoload option to current state
            var autoload = settingsService.getValue('autoload');
            if (!autoload) document.getElementById('settings-autoload').checked = false;

            // Set the data source dialog listeners and initialize label and radio button to the current value
            var datasourceDialog = document.getElementById('settings-datasource-dialog');
            document.getElementById('settings-datasource').addEventListener('click', function () {
                datasourceDialog.show();
            });
            document.getElementById('settings-datasource-cancel').addEventListener('click', function () {
                datasourceDialog.hide();
            });
            var currentDatasource = settingsService.getValue('datasource');
            setDataSourceLabel(currentDatasource);
            document.getElementById('settings-datasource-' + currentDatasource).checked = true;

            // Set custom data source click listener and initialize to current value
            document.querySelector('#settings-custom-datasource .list__item__subtitle').textContent =
                settingsService.getValue('custom-datasource');
            document.getElementById('settings-custom-datasource').addEventListener('click', function () {
                //noinspection JSValidateTypes
                ons.notification.prompt({
                    title: 'Custom Data Source',
                    message: 'Please enter a value:',
                    defaultValue: settingsService.getValue('custom-datasource')
                }).then(function (newValue) {
                    if (newValue !== '') {
                        document.querySelector('#settings-custom-datasource .list__item__subtitle').textContent = newValue;
                        settingsService.setValue('custom-datasource', newValue);
                    }
                });
            });

            // Set custom api endpoint click listener and initialize to current value
            document.querySelector('#settings-api-endpoint .list__item__subtitle').textContent =
                settingsService.getValue('api-endpoint');
            document.getElementById('settings-api-endpoint').addEventListener('click', function () {
                //noinspection JSValidateTypes
                ons.notification.prompt({
                    title: 'API Endpoint',
                    message: 'Please enter a value:',
                    defaultValue: settingsService.getValue('api-endpoint')
                }).then(function (newValue) {
                        if (newValue !== '') {
                            document.querySelector('#settings-api-endpoint .list__item__subtitle').textContent = newValue;
                            settingsService.setValue('api-endpoint', newValue);
                        }
                });
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
        // Handle external link items
        module.init = function () {
            enableExternalLinks('about');
        };
        return module;
    })();

    document.addEventListener('init', function (e) {
        var page = e.target;

        if (page.id === 'mapview') mapview.init(page);
        else if (page.id === 'settings') settings.init(page);
        else if (page.id === 'about') about.init(page);
    });
});
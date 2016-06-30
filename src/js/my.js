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
    var settingsService = {};
    (function (exports) {
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

        exports.setValue = function (key, newValue) {
            if (settings.hasOwnProperty(key)) {
                window.localStorage.setItem(settings[key].key, newValue);

                // Backwards compatibility with the options selector on the DDR finder home page, when on same domain
                if (key === 'datasource' && (newValue === 'ziv' || newValue === 'navi')) {
                    window.localStorage.setItem('datasrc', newValue);
                }
            }
        };

        // Returns the set value, properly cast, or null for invalid keys
        exports.getValue = function (key) {
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
        }
    })(settingsService);

    // Enables clickable items (used mainly for Settings/About clickable list items)
    var enableExternalLinks = function(pageid) {
        var externalLinks = document.querySelectorAll('#' + pageid + ' .external-link');
        for (var i = 0; i < externalLinks.length; ++i) {
            var link = externalLinks.item(i);
            link.addEventListener('click', (function () {
                window.open(this.getAttribute('data-href'));
            }).bind(link));
        }
    };

    // Each view exports certain functions, but contains its own scope

    // mapview
    var mapview = {};
    (function (exports) {
        exports.init = function () {
            document.getElementById('settings-button').addEventListener('click', function () {
                myNavigator.pushPage('settings.html');
            });

            var map = L.map('map').setView([36.2068047, -100.7467658], 4);

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

            var testData = {
                "type": "FeatureCollection",
                "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            -66.541163921356,
                            18.438006078186
                        ]
                    },
                    "properties": {
                        "id": 8450,
                        "src": "ziv",
                        "sid": "2623",
                        "name": "Caribbean Cinemas, Prime Outlets",
                        "city": "Barceloneta, Puerto Rico",
                        "hasDDR": 0,
                        "distance": 24.69
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            -66.639122217894,
                            17.997345959929
                        ]
                    },
                    "properties": {
                        "id": 8609,
                        "src": "ziv",
                        "sid": "2785",
                        "name": "Caribbean Cinemas, Ponce Towne Center",
                        "city": "Ponce, Puerto Rico",
                        "hasDDR": 0,
                        "distance": 25.38
                    }
                }]
            };

            L.geoJson(testData, {
                onEachFeature: function (feature, layer) {
                    var popupContainer = document.createElement('div');

                    var description = document.createElement('div');
                    description.innerHTML = '<b>' + feature.properties.name
                        + '</b><br>' + feature.properties.city + '</p>';

                    var moreInfo = document.createElement('ons-button');
                    moreInfo.textContent = 'More Info';
                    moreInfo.setAttribute('modifier', 'quiet');
                    // TODO: URL redirect to more info site
                    moreInfo.addEventListener('click', function () {
                        console.log('Clicked More Info: ' + feature);
                    });

                    var navigate = document.createElement('ons-button');
                    navigate.textContent = 'Navigate';
                    // TODO: URL open maps app
                    navigate.addEventListener('click', function () {
                        console.log('Clicked Navigate: ' + feature);
                    });

                    popupContainer.appendChild(description);
                    popupContainer.appendChild(moreInfo);
                    popupContainer.appendChild(navigate);

                    layer.bindPopup(popupContainer);
                }
            }).addData(testData).addTo(map);

            // Set attribution link targets to new window
            var attributionLinks = document.querySelectorAll('.leaflet-control-attribution a');
            for (var i = 0; i < attributionLinks.length; ++i) {
                attributionLinks.item(i).setAttribute('target', '_blank');
            }
        };
    })(mapview);

    // settings
    var settings = {};
    (function (exports) {
        // Extract the label for a given data source value
        var setDataSourceLabel = function (value) {
            document.querySelector('#settings-datasource .list__item__subtitle').textContent =
                document.querySelector('label[for=settings-datasource-' + value + ']').textContent.trim();
        };

        // React to onChange events on the form and save the values in localStorage, then emit a setting event
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

        exports.init = function (page) {
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
        };
    })(settings);

    // about
    var about = {};
    (function (exports) {
        // Handle external link items
        exports.init = function () {
            enableExternalLinks('about');
        };
    })(about);

    document.addEventListener('init', function (e) {
        var page = e.target;

        if (page.id === 'mapview') mapview.init(page);
        else if (page.id === 'settings') settings.init(page);
        else if (page.id === 'about') about.init(page);
    });
});
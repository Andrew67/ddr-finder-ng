# ddr-finder-ng
Next-generation Web UI for ddr-finder, made to look and feel like a native app.

On Android devices, it should look and feel like the native [DdrFinder](https://github.com/Andrew67/DdrFinder) app.

On iOS devices, it should look and feel like a native iOS app.

## Live Demo
The official working demo is at http://ddrfinder.andrew67.com/ng/, which connects to the [ddr-finder](https://github.com/Andrew67/ddr-finder) demo API instance.

## UI
* Framework: Onsen UI 2; see https://onsen.io/v2/.
* Map view: Leaflet; see http://leafletjs.com/.

## License
MIT license (see LICENSE); excludes favicon.png, arcade-machine.jpg, apple-touch-icon.png,
and other items that have their own license declarations.

## Developing your own version
* You will need your own tile provider API key. This project uses [Mapbox](https://www.mapbox.com/), although Leaflet allows swapping the underlying tile provider easily.
* Modify the default API endpoint value to point to your API deployment.

## Acknowledgments
* iPhone toting friends who can't use the Android app for inspiring me to make this.
* All acknowledgments listed in the [ddr-finder page](https://github.com/Andrew67/ddr-finder#acknowledgments).

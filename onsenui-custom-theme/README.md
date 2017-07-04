# OnsenUI Custom Theme Definition

This folder contains the .css file based on the OnsenUI theme.css, for custom Material Design colors to match the app.
It will generally require a manual comb-through whenever the OnsenUI library is updated.

For example, it was Stylus format until OnsenUI 2.2, in which they switched to postcss-cssnext.

Due to difficulty emulating their build steps, these are the out-of-band necessary steps:
* Copy theme.css to node_modules/onsenui/css-components-src.
* Run their gulp build (npm i && gulp build).
* Copy the generated onsen-css-components.css in node_modules/onsenui/build/css here.
* Project gulp build script picks up from there.

These steps are required when:
* Modifying the theme.css file.
* Updating OnsenUI.
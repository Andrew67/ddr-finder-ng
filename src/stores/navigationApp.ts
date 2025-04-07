/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { computed } from "nanostores";
import { $isAndroid, $isMac } from "./platform.ts";

/*
  Documentation of unused URLs/URIs:
  intent:
    intent URI allows us to combine the following two:
    geo URI that triggers app picker
        geo:lat,lng?q=lat,lng(encoded label)
    Google Maps URI if no apps available to handle geo
        https://maps.google.com/?q=loc:lat,lng(encoded label)
    See: https://developer.chrome.com/multidevice/android/intents
    return (
      getGeoURI(lat, lng, label).replace("geo:", "intent:") +
      "#Intent;scheme=geo;" +
      "S.browser_fallback_url=" +
      encodeURIComponent(getGoogleMapsURL(lat, lng, label)) +
      ";" +
      "end;");
    Would require supporting double-URI encoding below, currently not worth it.
    Must also retest Firefox and Samsung as had issues before around Firefox 68 and Samsung Internet 11 era.

    baidu URL:
      This one works for web but doesn't trigger the app immediately on iOS or transfer the search to it
      "http://api.map.baidu.com/marker?location=${lat},${lng}&title=${name}&content=GPS:%20${lat}º,%20${lng}º&coord_type=wgs84&output=html&src=webapp.baidu.openAPIdemo",

    gaode URL:
      This one works for web but doesn't trigger the app immediately on iOS, but does transfer the search to it
      "https://uri.amap.com/marker?position=${lng},${lat}&name=${name}&src=applicationName&coordinate=wgs84&callnative=1",
 */

const navigationUrls = {
  googleMaps: "https://maps.google.com/?q=loc:${lat},${lng}(${name})",
  appleMaps: "https://maps.apple.com/?q=${name}&ll=${lat},${lng}",
  androidGeo: "geo:${lat},${lng}?q=${lat},${lng}(${name})",
  // iOS-specific since on Android all map apps tend to handle geo URIs
  // TODO: Test on Android/offer for web
  waze: "https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes",
  here: "https://share.here.com/l/${lat},${lng}",
  osmAnd: "https://osmand.net/map/?pin=${lat},${lng}#9/${lat}/${lng}",
  magicEarth: "magicearth://?show_on_map&lat=${lat}&lon=${lng}&name=${name}",
  sygic: "com.sygic.aura://coordinate|${lng}|${lat}|drive",
  // China
  // 百度地图
  baiduDitu:
    "baidumap://map/marker?location=${lat},${lng}&title=${name}&content=GPS:%20${lat}º,%20${lng}º&coord_type=wgs84&src=ios.baidu.openAPIdemo",
  // gaodeDitu 高德地图
  amap: "iosamap://viewMap?sourceApplication=applicationName&poiname=${name}&lat=${lat}&lon=${lng}&dev=1",
  // Korea
  kakaoMap: "kakaomap://look?p=${lat},${lng}",
  naverMap:
    "nmap://place?lat=${lat}&lng=${lng}&name=${name}&appname=com.example.myapp",
} as const;

// TODO: Preferred navigation app setting for iOS
export const $navigationUrl = computed(
  [$isMac, $isAndroid],
  (isMac, isAndroid) => {
    if (isMac) return navigationUrls.appleMaps;
    if (isAndroid) return navigationUrls.androidGeo;
    return navigationUrls.googleMaps;
  },
);

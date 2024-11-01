/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */

/** Promise-based wrapper for `getCurrentPosition` DOM API */
export function getCurrentPosition(
  options: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

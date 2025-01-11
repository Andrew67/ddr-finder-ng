/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */

/**
 * For a numeric string, returns the number of digits after the decimal.
 */
export function numDecimalDigits(num: string) {
  return num.includes(".") ? num.split(".")[1].length : 0;
}

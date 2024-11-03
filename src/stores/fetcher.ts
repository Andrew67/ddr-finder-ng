/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { nanoquery } from "@nanostores/query";

const API_BASE_URL = "https://ddrfinder-api.andrew67.com/v4";

export const [createFetcherStore] = nanoquery({
  fetcher: (...keys) =>
    fetch(API_BASE_URL + keys.join("")).then((r) => r.json()),
});

/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { nanoquery } from "@nanostores/query";

export const [createFetcherStore] = nanoquery({
  fetcher: (...keys) =>
    fetch(import.meta.env.PUBLIC_API_URL + keys.join("")).then((response) =>
      response.json().then((obj) => {
        if (!response.ok) throw obj;
        return obj;
      }),
    ),
});

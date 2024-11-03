/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";
import type { StaticMapProps } from "../../stores/nearby/staticMap.ts";

export const StaticMap: FunctionComponent<
  StaticMapProps & { isLoading: boolean }
> = (props) => {
  const { lightThemeUrl, darkThemeUrl, width, height, isLoading } = props;
  return (
    <div
      className={`box-content max-w-full bg-base-200 sm:mx-4 sm:border sm:border-primary ${
        isLoading ? "skeleton rounded-none" : ""
      }`}
      style={{
        width: width,
        // Uses height value for placeholder, otherwise preserves aspect ratio
        height: lightThemeUrl.length > 0 ? null : height,
      }}
    >
      {lightThemeUrl.length > 0 && (
        <picture>
          <source
            media="screen and (prefers-color-scheme: dark)"
            srcSet={darkThemeUrl}
          />
          <img
            src={lightThemeUrl}
            width={width}
            height={height}
            alt="Map of your location and nearby arcade locations"
          />
        </picture>
      )}
    </div>
  );
};

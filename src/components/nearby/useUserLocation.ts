/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import { useState } from "preact/hooks";
import { getCurrentPosition } from "../../utils/getCurrentPosition.ts";

export const useUserLocation = (
  initialValue: GeolocationPosition | null,
): [
  userLocation: GeolocationPosition | null,
  userLocationError: number,
  getUserLocation: () => void,
] => {
  // TODO: Local storage
  const [userLocation, setUserLocation] = useState(initialValue);
  const [userLocationError, setUserLocationError] = useState(0);

  const getUserLocation = (): void => {
    // Try first for freshest most accurate fast location
    getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 3_000,
      maximumAge: 180_000, // 3 minutes
    })
      .catch((error: GeolocationPositionError) => {
        // Don't retry if error is permission denied
        if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
          throw error;
        }

        // Otherwise retry with less accuracy, allowing older location
        return getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 7_000,
          maximumAge: 3_600_000, // 1 hour
        });
      })
      .then(
        ({ coords, timestamp }: GeolocationPosition) => {
          // Re-casting, otherwise a cached location doesn't trigger downstream effects
          setUserLocation({ coords, timestamp });
          setUserLocationError(0);
        },
        (error: GeolocationPositionError) => {
          setUserLocationError(error.code);
        },
      );
  };

  return [userLocation, userLocationError, getUserLocation];
};

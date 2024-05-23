import { useState } from "preact/hooks";
import { getCurrentPosition } from "./getCurrentPosition.ts";

export const useUserLocation = (): [
  userLocation: GeolocationPosition | null,
  userLocationError: number,
  getUserLocation: () => void,
] => {
  // TODO: Local storage
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(
    null,
  );
  const [userLocationError, setUserLocationError] = useState<number>(0);

  const getUserLocation = (): void => {
    // Try first for freshest most accurate fast location
    getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 3_000,
      maximumAge: 180_000,
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
          maximumAge: 3_600_000,
        });
      })
      .then(
        (value: GeolocationPosition) => {
          setUserLocation(value);
          setUserLocationError(0);
        },
        (error: GeolocationPositionError) => {
          setUserLocationError(error.code);
        },
      );
  };

  return [userLocation, userLocationError, getUserLocation];
};

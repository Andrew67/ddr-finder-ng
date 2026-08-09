/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, Fragment, FunctionComponent } from "preact";
import { useRef } from "preact/compat";
import { useEffect } from "preact/hooks";

import { useStore } from "@nanostores/preact";
import { i18n } from "@/stores/i18n";

export const messages = i18n("userLocationError", {
  positionUnavailable: "Position Unavailable",
  positionAdvice: `Make sure GPS, Wi-Fi, and Bluetooth are enabled, then try again.
If your location permission is set to "approximate", you may need to change it to "precise".
You might also need to walk outside.`,
  confirm: "I understand",
});

type UserLocationErrorProps = {
  error: GeolocationPositionError["code"];
  dismissClick: () => void;
};

export const UserLocationError: FunctionComponent<UserLocationErrorProps> = (
  props,
) => {
  const t = useStore(messages);
  const { error } = props;
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (error > 0) modalRef.current?.showModal();
    else modalRef.current?.close();
  }, [error]);

  return (
    <dialog
      className="modal modal-bottom sm:modal-middle"
      onClose={props.dismissClick}
      ref={modalRef}
    >
      <div className="modal-box">
        {/* TODO: i18n, but `<geolocation>` element will take care of this */}
        {error === GeolocationPositionError.PERMISSION_DENIED && (
          <>
            <h3 className="font-bold text-lg">Enable Current Location</h3>
            <p className="py-4">
              To search near you, make sure you allow the location permission
              for this site, your web browser, and your phone settings.
            </p>
          </>
        )}
        {(error === GeolocationPositionError.POSITION_UNAVAILABLE ||
          error === GeolocationPositionError.TIMEOUT) && (
          <>
            <h3 className="font-bold text-lg">{t.positionUnavailable}</h3>
            <p className="py-4 whitespace-pre-line">{t.positionAdvice}</p>
          </>
        )}
        <form method="dialog" className="modal-action mb-inset-bottom sm:mb-0">
          {/* if there is a button in form, it will close the modal */}
          <button type="submit" className="btn">
            {t.confirm}
          </button>
        </form>
      </div>
    </dialog>
  );
};

import type { h, FunctionComponent } from "preact";
import { useRef } from "preact/compat";
import { useEffect } from "preact/hooks";

type UserLocationErrorProps = {
  error: GeolocationPositionError["code"];
  dismissClick: () => void;
};

export const UserLocationError: FunctionComponent<UserLocationErrorProps> = (
  props,
) => {
  const { error } = props;
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (error > 0) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [error]);

  return (
    <>
      <dialog
        className="modal modal-bottom sm:modal-middle"
        onClose={props.dismissClick}
        ref={modalRef}
      >
        <div className="modal-box">
          {error === GeolocationPositionError.PERMISSION_DENIED && (
            <>
              <h3 className="font-bold text-lg">Enable Current Location</h3>
              <p className="py-4">
                To search near you, make sure you allow the location permission
                for this site, your web browser, and your phone settings.
              </p>
            </>
          )}
          {error === GeolocationPositionError.POSITION_UNAVAILABLE ||
            (error === GeolocationPositionError.TIMEOUT && (
              <>
                <h3 className="font-bold text-lg">Position Unavailable</h3>
                <p className="py-4">
                  Make sure GPS, Wi-Fi, and Bluetooth are enabled, then try
                  again.
                  <br />
                  You might also need to walk outside.
                </p>
              </>
            ))}
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">I understand</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
};

/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent, JSX } from "preact";
import { useRef } from "preact/compat";
import { useEffect, useMemo } from "preact/hooks";

import { iosNavigationApps } from "../../stores/navigationApp.ts";

function getAppButton(id: string, label: string): JSX.Element {
  // TODO: Active app highlight
  return (
    <button type="submit" className="btn btn-ghost px-0 py-2 flex-col h-auto">
      <img
        class="mask mask-squircle"
        src={`/img/ios-apps/${id}.webp`}
        alt=""
        width="60"
        height="60"
      />
      {label}
    </button>
  );
}

type NavigationAppSelectorProps = {
  open: boolean;
  dismissClick: () => void;
};

export const NavigationAppSelector: FunctionComponent<
  NavigationAppSelectorProps
> = (props) => {
  const { open } = props;
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) modalRef.current?.showModal();
    else modalRef.current?.close();
  }, [open]);

  const appButtons = useMemo(
    () =>
      Object.entries(iosNavigationApps).map(([id, label]) =>
        getAppButton(id, label),
      ),
    [iosNavigationApps],
  );

  // TODO: Save selected app onSubmit
  return (
    <dialog
      className="modal modal-bottom sm:modal-middle"
      onClose={props.dismissClick}
      ref={modalRef}
    >
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-lg mb-4">Select Navigation App</h3>
        <fieldset className="grid grid-cols-3 gap-2">{appButtons}</fieldset>
        <div className="mb-inset-bottom sm:mb-0"></div>
      </form>

      <form method="dialog" className="modal-backdrop">
        <button type="submit">Cancel</button>
      </form>
    </dialog>
  );
};

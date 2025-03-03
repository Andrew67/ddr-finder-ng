/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent, JSX } from "preact";
import { useRef } from "preact/compat";
import { useCallback, useEffect, useMemo } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import {
  $activeSourceId,
  $sources,
  setActiveSourceId,
} from "../stores/sources.ts";
import type { DataSource } from "../api-types/sources";

/** Per API docs, Scope is either "world" or a 2-letter country code */
function getScopeLabel(scope: DataSource["scope"]): string {
  if (scope === "world") return " (Worldwide)";
  const countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(
    scope,
  );
  return countryName ? ` (${countryName})` : "";
}

function getSourceOption(
  source: DataSource,
  activeSourceId: DataSource["id"],
): JSX.Element {
  return (
    <option value={source.id} selected={activeSourceId === source.id}>
      {source.name}
      {getScopeLabel(source.scope)}
    </option>
  );
}

/** `form.elements` TS helper: {@link https://stackoverflow.com/a/70995964} */
type FormElements<U extends string> = HTMLFormControlsCollection &
  Record<U, HTMLInputElement>;

type FilterSourceSettingsProps = {
  open: boolean;
  dismissClick: () => void;
};

export const SearchSettings: FunctionComponent<FilterSourceSettingsProps> = (
  props,
) => {
  const { open } = props;
  const modalRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) modalRef.current?.showModal();
    else modalRef.current?.close();
  }, [open]);

  const sources = useStore($sources);
  const activeSourceId = useStore($activeSourceId);

  const defaultSource = useMemo(() => {
    if (!sources.data || !activeSourceId) return <></>;
    const defaultSource = sources.data.sources[sources.data.default];

    return (
      <optgroup label="Recommended">
        {getSourceOption(defaultSource, activeSourceId)}
      </optgroup>
    );
  }, [sources.data, activeSourceId]);

  const otherSources = useMemo(() => {
    if (!sources.data || !activeSourceId) return <></>;
    const otherSources = Object.values(sources.data.sources).filter(
      (source) => source.id !== sources.data!.default,
    );

    return (
      <optgroup label="Other">
        {otherSources.map((source) => getSourceOption(source, activeSourceId))}
      </optgroup>
    );
  }, [sources.data, activeSourceId]);

  const onSubmit = useCallback(() => {
    const formElements = formRef.current!
      .elements as FormElements<"dataSource">;
    const newSourceId = formElements.dataSource.value;
    setActiveSourceId(newSourceId);
  }, []);

  return (
    <dialog
      className="modal modal-bottom sm:modal-middle"
      onClose={props.dismissClick}
      ref={modalRef}
    >
      <form
        method="dialog"
        className="modal-box"
        onSubmit={onSubmit}
        ref={formRef}
      >
        <h3 className="font-bold text-lg mb-2">Search Settings</h3>

        <label className="form-control max-w-xs mb-2">
          <div className="label">
            <span className="label-text">Data Source</span>
          </div>
          <select className="select select-accent" name="dataSource">
            {defaultSource}
            {otherSources}
          </select>
        </label>

        <div className="label pb-0">
          <span className="label-text">Game Filter</span>
        </div>
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="radio"
              name="gameFilter"
              value="off"
              className="radio checked:bg-primary"
              defaultChecked
              disabled
            />
            <span className="label-text">Any games</span>
          </label>
        </div>
        <div className="form-control">
          <label className="label pb-0 cursor-pointer justify-start gap-2">
            <input
              type="radio"
              name="gameFilter"
              value="on"
              className="radio checked:bg-primary"
              disabled
            />
            <span className="label-text">Must have either of:</span>
          </label>
        </div>
        <div className="join ms-8">
          <input
            className="join-item btn"
            type="checkbox"
            name="gameFilterDdr"
            aria-label="DDR"
            disabled
          />
          <input
            className="join-item btn"
            type="checkbox"
            name="gameFilterPiu"
            aria-label="PIU"
            disabled
          />
          <input
            className="join-item btn"
            type="checkbox"
            name="gameFilterSmx"
            aria-label="SMX"
            disabled
          />
        </div>

        <div className="modal-action">
          {/* if there is a button in form, it will close the modal */}
          <button type="submit" className="btn btn-secondary">
            Save
          </button>
        </div>
      </form>

      <form method="dialog" className="modal-backdrop">
        <button type="submit">Cancel</button>
      </form>
    </dialog>
  );
};

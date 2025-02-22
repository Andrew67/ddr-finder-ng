/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent, JSX } from "preact";
import { useRef } from "preact/compat";
import { useEffect, useMemo } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { $activeSourceId, $sources } from "../stores/sources.ts";
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
    if (open) {
      modalRef.current?.showModal();
      formRef.current?.reset();
    } else modalRef.current?.close();
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

  return (
    <dialog
      class="modal modal-bottom sm:modal-middle"
      onClose={props.dismissClick}
      ref={modalRef}
    >
      {/* TODO: Handle submit / load existing state */}
      <form method="dialog" class="modal-box" onSubmit={() => {}} ref={formRef}>
        <h3 class="font-bold text-lg mb-2">Search Settings</h3>

        <label class="form-control max-w-xs mb-2">
          <div class="label">
            <span class="label-text">Data Source</span>
          </div>
          <select class="select select-accent" id="data-source-select">
            {defaultSource}
            {otherSources}
          </select>
        </label>

        <div class="label pb-0">
          <span class="label-text">Game Filter</span>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-2">
            <input
              type="radio"
              name="game-filter"
              value="none"
              class="radio checked:bg-primary"
              defaultChecked
            />
            <span class="label-text">Any games</span>
          </label>
        </div>
        <div class="form-control">
          <label class="label pb-0 cursor-pointer justify-start gap-2">
            <input
              type="radio"
              name="game-filter"
              value="either-of"
              class="radio checked:bg-primary"
            />
            <span class="label-text">Must have either of:</span>
          </label>
        </div>
        <div class="join ms-8">
          <input
            class="join-item btn"
            type="checkbox"
            name="game-filter-ddr"
            aria-label="DDR"
          />
          <input
            class="join-item btn"
            type="checkbox"
            name="game-filter-piu"
            aria-label="PIU"
          />
          <input
            class="join-item btn"
            type="checkbox"
            name="game-filter-smx"
            aria-label="SMX"
          />
        </div>

        <div class="modal-action">
          {/* if there is a button in form, it will close the modal */}
          <button type="submit" class="btn btn-secondary" disabled>
            Save
          </button>
        </div>
      </form>

      <form method="dialog" class="modal-backdrop">
        <button type="submit">Cancel</button>
      </form>
    </dialog>
  );
};

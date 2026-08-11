/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, Fragment, FunctionComponent } from "preact";
import { useRef } from "preact/compat";
import { useCallback, useEffect, useMemo } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { params } from "@nanostores/i18n";

import { $locale, i18n } from "@/stores/i18n.ts";
import { $activeSourceId, $sources, setActiveSourceId } from "@/stores/sources";
import { $gameFilter, setGameFilter } from "@/stores/gameFilter";
import type { DataSource } from "@/api-types/sources";

export const messages = i18n("searchSettings", {
  title: "Search Settings",
  dataSource: "Data Source",
  gameFilter: "Game Filter",
  anyGames: "Any games",
  mustHave: "Must have either of:",
  worldScope: " (Worldwide)",
  countryScope: params(" ({countryName})"),
  recommendedSource: "Recommended",
  otherSource: "Other",
  save: "Save",
  cancel: "Cancel",
});

/** `form.elements` TS helper: {@link https://stackoverflow.com/a/70995964} */
type FormElements<U extends string> = HTMLFormControlsCollection &
  Record<U, HTMLInputElement>;

type SearchSettingsFormElements = FormElements<
  | "dataSource"
  | "gameFilter"
  | "gameFilterDdr"
  | "gameFilterPiu"
  | "gameFilterSmx"
>;

type SearchSettingsProps = {
  open: boolean;
  dismissClick: () => void;
};

export const SearchSettings: FunctionComponent<SearchSettingsProps> = (
  props,
) => {
  const locale = useStore($locale);
  const t = useStore(messages);

  /** Per API docs, Scope is either "world" or a 2-letter country code */
  const getScopeLabel = useCallback(
    (scope: DataSource["scope"]): string => {
      if (scope === "world") return t.worldScope;
      const countryName = new Intl.DisplayNames([locale], {
        type: "region",
      }).of(scope);
      return countryName ? t.countryScope({ countryName }) : "";
    },
    [locale, t.worldScope],
  );

  const getSourceOption = useCallback(
    (source: DataSource, activeSourceId: DataSource["id"]) => {
      return (
        <option value={source.id} selected={activeSourceId === source.id}>
          {source.name}
          {getScopeLabel(source.scope)}
        </option>
      );
    },
    [getScopeLabel],
  );

  const { open } = props;
  const modalRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) modalRef.current?.showModal();
    else modalRef.current?.close();
  }, [open]);

  const sources = useStore($sources);
  const activeSourceId = useStore($activeSourceId);
  const gameFilter = useStore($gameFilter);

  const defaultSource = useMemo(() => {
    if (!sources.data || !activeSourceId) return <></>;
    const defaultSource = sources.data.sources[sources.data.default];

    return (
      <optgroup label={t.recommendedSource}>
        {getSourceOption(defaultSource, activeSourceId)}
      </optgroup>
    );
  }, [sources.data, activeSourceId, t.recommendedSource, getSourceOption]);

  const otherSources = useMemo(() => {
    if (!sources.data || !activeSourceId) return <></>;
    const otherSources = Object.values(sources.data.sources).filter(
      (source) => source.id !== sources.data!.default,
    );

    return (
      <optgroup label={t.otherSource}>
        {otherSources.map((source) => getSourceOption(source, activeSourceId))}
      </optgroup>
    );
  }, [sources.data, activeSourceId, t.otherSource, getSourceOption]);

  // TODO: Disable game filter options when unsupported by data source

  /** When clicking "Any games" / off, disable all game filter checkboxes */
  const onFilterOffClick = useCallback(() => {
    const formElements = formRef.current!
      .elements as SearchSettingsFormElements;
    formElements.gameFilterDdr.checked = false;
    formElements.gameFilterPiu.checked = false;
    formElements.gameFilterSmx.checked = false;
  }, []);

  /** When clicking on a game filter, change game filter to "Must have" / on */
  const onGameFilterClick = useCallback(() => {
    const formElements = formRef.current!
      .elements as SearchSettingsFormElements;
    formElements.gameFilter.value = "on";
  }, []);

  const onSubmit = useCallback(() => {
    const formElements = formRef.current!
      .elements as SearchSettingsFormElements;
    const newSourceId = formElements.dataSource.value;
    setActiveSourceId(newSourceId);

    const newGameFilter: string[] = [];
    if (formElements.gameFilter.value === "on") {
      if (formElements.gameFilterDdr.checked) newGameFilter.push("ddr");
      if (formElements.gameFilterPiu.checked) newGameFilter.push("piu");
      if (formElements.gameFilterSmx.checked) newGameFilter.push("smx");
    }
    setGameFilter(newGameFilter);
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
        <fieldset class="fieldset">
          <legend class="font-bold text-lg mb-2">{t.title}</legend>

          <label
            class="label text-base-content"
            for="search-settings-data-source"
          >
            {t.dataSource}
          </label>
          <select
            id="search-settings-data-source"
            className="select select-accent mb-2"
            name="dataSource"
          >
            {defaultSource}
            {otherSources}
          </select>

          <div className="label text-base-content">{t.gameFilter}</div>
          <label className="label text-base-content cursor-pointer gap-2">
            <input
              type="radio"
              name="gameFilter"
              value="off"
              className="radio radio-primary"
              defaultChecked={gameFilter.length === 0}
              onClick={onFilterOffClick}
            />
            {t.anyGames}
          </label>
          <label className="label text-base-content cursor-pointer gap-2">
            <input
              type="radio"
              name="gameFilter"
              value="on"
              className="radio radio-primary"
              defaultChecked={gameFilter.length !== 0}
            />
            {t.mustHave}
          </label>
          <div className="join ms-8">
            <input
              className="join-item btn"
              type="checkbox"
              name="gameFilterDdr"
              aria-label="DDR"
              defaultChecked={gameFilter.includes("ddr")}
              onClick={onGameFilterClick}
            />
            <input
              className="join-item btn"
              type="checkbox"
              name="gameFilterPiu"
              aria-label="PIU"
              defaultChecked={gameFilter.includes("piu")}
              onClick={onGameFilterClick}
            />
            <input
              className="join-item btn"
              type="checkbox"
              name="gameFilterSmx"
              aria-label="SMX"
              defaultChecked={gameFilter.includes("smx")}
              onClick={onGameFilterClick}
            />
          </div>
        </fieldset>

        <div className="modal-action mb-inset-bottom sm:mb-0">
          {/* if there is a button in form, it will close the modal */}
          <button type="submit" className="btn btn-secondary">
            {t.save}
          </button>
        </div>
      </form>

      <form method="dialog" className="modal-backdrop">
        <button type="submit">{t.cancel}</button>
      </form>
    </dialog>
  );
};

/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { FunctionComponent } from "preact";
import { useMemo } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { params } from "@nanostores/i18n";

import { $locale, i18n } from "@/stores/i18n.ts";

export const messages = i18n("accuracy", {
  message: params("Accurate to approximately {meters}"),
});

type AccuracyProps = {
  accuracy: number;
};

export const Accuracy: FunctionComponent<AccuracyProps> = (props) => {
  const locale = useStore($locale);
  const t = useStore(messages);
  const { accuracy } = props;

  const kmFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "kilometer",
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const meterFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "meter",
        unitDisplay: "long",
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const formattedAccuracy = useMemo(() => {
    return accuracy >= 1000
      ? kmFormatter.format(accuracy / 1000)
      : meterFormatter.format(accuracy);
  }, [accuracy, kmFormatter, meterFormatter]);

  return formattedAccuracy && t.message({ meters: formattedAccuracy });
};

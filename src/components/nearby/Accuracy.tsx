/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { FunctionComponent } from "preact";
import { useMemo } from "preact/hooks";

type AccuracyProps = {
  accuracy: number;
};

const kmFormatter = new Intl.NumberFormat("en-US", {
  style: "unit",
  unit: "kilometer",
  maximumFractionDigits: 2,
});

const meterFormatter = new Intl.NumberFormat("en-US", {
  style: "unit",
  unit: "meter",
  unitDisplay: "long",
  maximumFractionDigits: 0,
});

export const Accuracy: FunctionComponent<AccuracyProps> = (props) => {
  const { accuracy } = props;

  const formattedAccuracy = useMemo(() => {
    return accuracy >= 1000
      ? kmFormatter.format(accuracy / 1000)
      : meterFormatter.format(accuracy);
  }, [accuracy]);

  return (
    formattedAccuracy && <>Accurate to approximately {formattedAccuracy}</>
  );
};

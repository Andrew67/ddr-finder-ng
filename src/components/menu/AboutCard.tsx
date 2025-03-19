/*! ddr-finder | https://github.com/Andrew67/ddr-finder-ng/blob/master/LICENSE */
import type { h, FunctionComponent } from "preact";

export const AboutCard: FunctionComponent = () => (
  <div className="card bg-primary text-primary-content">
    <div className="card-body">
      <h2 className="card-title">About</h2>
      <p className="-mt-2 flex flex-col items-center">
        <img src="/img/icon-192.png" width="96" height="96" alt="" />
        <span className="text-lg">DDR Finder</span>
        <span className="text-sm">&copy;2012&ndash;2025 Andrés Cordero</span>
      </p>
      <div className="card-actions justify-end">
        <a
          href="https://github.com/Andrew67/ddr-finder-ng"
          target="_blank"
          className="btn"
        >
          Project Site
        </a>
      </div>
    </div>
  </div>
);

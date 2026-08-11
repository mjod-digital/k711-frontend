"use client";

import type { GenplanApartment } from "@/lib/apartments";
import { GENPLAN_FRAME_HEIGHT, GENPLAN_FRAME_WIDTH, GENPLAN_VIEWS } from "../../model/config";
import { useDesktopViewport } from "../../model/useDesktopViewport";
import { useFrameSequencePlayer } from "../../model/useFrameSequencePlayer";
import { ApartmentOverlay } from "../apartment-overlay/apartment-overlay";
import { GenplanNavigation } from "../navigation/genplan-navigation";
import styles from "./genplan-stage.module.scss";
import { FC } from 'react';

type TGenplanStage = {
  apartments: GenplanApartment[];
};

export const GenplanStage:FC<TGenplanStage> = ({ apartments }) => {
  const isDesktop = useDesktopViewport();
  const { canvasRef, state, goToView } = useFrameSequencePlayer(isDesktop);
  const currentView = GENPLAN_VIEWS[state.currentViewIndex];
  const isBusy = state.status === "loading" || state.status === "playing";

  if (!isDesktop) return null;

  return (
    <div className={styles.genplanStage}>
      <div className={styles.genplanStage__toolbar}>
        <GenplanNavigation
          currentViewIndex={state.currentViewIndex}
          status={state.status}
          onSelect={goToView}
        />
      </div>

      <div className={styles.genplanStage__viewport} aria-busy={isBusy}>
        <canvas
          ref={canvasRef}
          className={styles.genplanStage__canvas}
          width={GENPLAN_FRAME_WIDTH}
          height={GENPLAN_FRAME_HEIGHT}
          aria-hidden="true"
        />

        <ApartmentOverlay
          apartments={apartments}
          viewId={currentView.id}
          isInteractive={state.status === "ready"}
        />

        {state.status === "loading" && (
          <div className={styles.genplanStage__initialLoader} aria-live="polite">
            <div className={styles.genplanStage__loaderContent}>
              <span className={styles.genplanStage__loaderLine} aria-hidden="true">
                <span style={{ transform: `scaleX(${state.progress})` }} />
              </span>
              <span className={styles.genplanStage__loaderPercent}>{Math.round(state.progress * 100)}%</span>
            </div>
          </div>
        )}

        {state.error && (
          <p className={styles.genplanStage__error} role="alert">
            {state.error}
          </p>
        )}
      </div>
    </div>
  );
}

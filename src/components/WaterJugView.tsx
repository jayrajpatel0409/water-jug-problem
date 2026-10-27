import React from 'react';
import {
  Tv,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Play,
  Pause,
} from 'lucide-react';
import { JugAction, JugState, SearchNode } from '../core/types';
import { formatState, JUG_LABELS, getValidTransitions } from '../core/stateTransitions';

interface WaterJugViewProps {
  state: JugState;
  capacities: number[];
  goalAmount?: number;
  activeAction: JugAction | null;
  isGoal: boolean;
  manualMode: boolean;
  onApplyManualAction?: (action: JugAction) => void;
  manualMoveCount?: number;
  onResetManual?: () => void;
  speedMs: number;
  onChangeSpeed: (ms: number) => void;
  // Solution playback props
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRestart: () => void;
  onJumpFinal: () => void;
  currentStep: number;
  totalSteps: number;
  solutionPath: SearchNode[];
  onSelectStep: (stepIdx: number) => void;
}

// Clean short label formatter matching screenshot ("Fill B", "Pour B → A", etc.)
export function formatShortActionLabel(label: string): string {
  return label
    .replace(/Jug\s+/gi, '')
    .replace(/into\s+/gi, '→ ')
    .replace(/->/g, '→')
    .trim();
}

export const WaterJugView: React.FC<WaterJugViewProps> = ({
  state,
  capacities,
  goalAmount,
  activeAction,
  manualMode,
  onApplyManualAction,
  speedMs,
  onChangeSpeed,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onRestart,
  onJumpFinal,
  currentStep,
  totalSteps,
  solutionPath,
  onSelectStep,
}) => {
  const animDurationMs = Math.max(300, Math.round(speedMs * 0.75));
  const progressPercent =
    totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  const validTransitions = manualMode
    ? getValidTransitions(state, capacities)
    : [];

  // Description for current step banner
  const currentStepTitle =
    currentStep === 0
      ? 'STARTING POINT'
      : `STEP ${currentStep}: ${activeAction?.type || 'ACTION'}`;

  const currentStepDesc =
    currentStep === 0
      ? 'All jugs start empty.'
      : activeAction
      ? formatShortActionLabel(activeAction.label)
      : 'Initial configuration.';

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 flex flex-col justify-between space-y-4">
      {/* 1. Header: Watch the solution */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-[#0088ff] text-white flex items-center justify-center shrink-0 shadow-sm">
          <Tv className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
            {manualMode ? 'Play the puzzle' : 'Watch the solution'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {manualMode
              ? 'Click valid moves to reach the goal manually.'
              : 'Press play and follow each pour.'}
          </p>
        </div>
      </div>

      {/* 2. Step Callout Banner ("STARTING POINT", yellow circle 0) */}
      <div className="bg-[#f0f9ff] border border-sky-200/70 rounded-2xl p-3 px-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-amber-400 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
            {currentStep}
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none">
              {currentStepTitle}
            </span>
            <span className="text-sm font-extrabold text-slate-800 leading-tight block mt-0.5">
              {currentStepDesc}
            </span>
          </div>
        </div>

        <div className="bg-white border border-sky-200 text-[#0088ff] px-3.5 py-1 rounded-full font-mono font-bold text-xs shadow-2xs">
          {formatState(state)}
        </div>
      </div>

      {/* 3. Water Jugs Card (Light cyan background container with rounded jugs) */}
      <div className="bg-[#e0f4fc]/70 p-6 rounded-3xl border border-sky-100 flex flex-col items-center justify-center relative min-h-[260px]">
        <div className="flex items-end justify-center space-x-8 sm:space-x-12 w-full">
          {capacities.map((cap, idx) => {
            const currentWater = state[idx] || 0;
            const percentage = Math.min(100, Math.round((currentWater / cap) * 100));
            const jugLabel = JUG_LABELS[idx];
            // In screenshot, goal indicator line is shown on the primary target jug (idx === 0)
            const showGoalLine = idx === 0 && goalAmount !== undefined && goalAmount <= cap;
            const goalPercent = showGoalLine ? (goalAmount / cap) * 100 : 0;

            // Height scales with capacity
            const jugHeightPx = Math.min(220, Math.max(160, 130 + cap * 12));

            // Ticks: show 3 on Jug A, 1 on Jug B like in screenshot
            const ticks: number[] = [];
            for (let l = 1; l < cap; l++) {
              if (l !== goalAmount || !showGoalLine) {
                ticks.push(l);
              }
            }

            return (
              <div key={idx} className="flex flex-col items-center">
                {/* The Jug Container Frame */}
                <div
                  style={{ height: `${jugHeightPx}px` }}
                  className="w-28 sm:w-32 relative rounded-b-[2.5rem] rounded-t-xl border-4 border-slate-200/90 bg-white/75 backdrop-blur-xs overflow-hidden shadow-2xs flex flex-col justify-end transition-all"
                >
                  {/* Goal Dashed Line on primary jug */}
                  {showGoalLine && (
                    <div
                      style={{ bottom: `${goalPercent}%` }}
                      className="absolute left-0 right-0 border-b-2 border-dashed border-[#10b981] z-20 pointer-events-none flex items-center justify-start pl-2"
                    >
                      <span className="bg-[#10b981] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm tracking-wider uppercase -mt-2">
                        goal
                      </span>
                    </div>
                  )}

                  {/* Tick Marks on the right side */}
                  <div className="absolute inset-0 pointer-events-none z-15 flex flex-col justify-between py-2">
                    {ticks.map((tick) => {
                      const bottomPct = (tick / cap) * 100;
                      return (
                        <div
                          key={tick}
                          style={{ bottom: `${bottomPct}%` }}
                          className="absolute right-2 flex items-center space-x-1"
                        >
                          <span className="text-[10px] text-slate-400 font-bold font-mono">
                            {tick} &mdash;
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Animated Liquid Surface & Fill */}
                  <div
                    style={{
                      height: `${percentage}%`,
                      transition: `height ${animDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    }}
                    className="w-full bg-gradient-to-t from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] relative overflow-hidden"
                  >
                    {/* Water highlight line */}
                    {percentage > 0 && (
                      <div className="absolute top-0 left-0 right-0 h-2 bg-white/30" />
                    )}
                  </div>
                </div>

                {/* Below Jug: Volume Number & Jug Badge */}
                <div className="mt-3 text-center space-y-1">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans leading-none">
                    {currentWater} <span className="text-slate-400 font-bold text-sm">/ {cap} L</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1.5 pt-0.5">
                    <span className="w-5 h-5 rounded-full bg-[#0088ff] text-white font-extrabold text-[11px] flex items-center justify-center">
                      {jugLabel}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      Jug {jugLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manual Action Buttons (If in Manual Play mode) */}
        {manualMode && (
          <div className="mt-4 pt-3 border-t border-sky-200/60 w-full">
            <span className="text-xs font-bold text-slate-600 block mb-2">
              Valid Moves ({validTransitions.length}):
            </span>
            <div className="flex flex-wrap gap-2 justify-center">
              {validTransitions.map(({ action }, i) => (
                <button
                  key={i}
                  onClick={() => onApplyManualAction && onApplyManualAction(action)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 shadow-2xs transition cursor-pointer"
                >
                  {formatShortActionLabel(action.label)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Playback Controls Card */}
      {!manualMode && (
        <div className="bg-white/90 rounded-2xl p-4 border border-sky-100 shadow-2xs space-y-3">
          {/* Top Row: 0/4, Progress Slider, 0% */}
          <div className="flex items-center space-x-3 text-xs font-bold text-slate-500 font-mono">
            <span className="min-w-8">
              {currentStep}/{totalSteps}
            </span>
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min="0"
                max={Math.max(1, totalSteps)}
                value={currentStep}
                onChange={(e) => onSelectStep(parseInt(e.target.value))}
                className="w-full h-1.5 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-[#0088ff]"
              />
            </div>
            <span className="min-w-8 text-right">
              {progressPercent}%
            </span>
          </div>

          {/* Middle Row: [⟲] [<] [▶ Play solution] [>] [⏭] */}
          <div className="flex items-center justify-center space-x-3">
            {/* Restart */}
            <button
              onClick={onRestart}
              disabled={currentStep === 0}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-2xs transition cursor-pointer"
              title="Restart (Step 0)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={onPrev}
              disabled={currentStep === 0}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-2xs transition cursor-pointer"
              title="Previous step"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Play/Pause Main Blue Pill */}
            {isPlaying ? (
              <button
                onClick={onPause}
                className="bg-[#0088ff] hover:bg-blue-600 text-white font-bold px-6 py-2.5 rounded-full shadow-md shadow-blue-500/20 flex items-center space-x-2 text-sm cursor-pointer transition"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={onPlay}
                disabled={totalSteps === 0}
                className="bg-[#0088ff] hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-full shadow-md shadow-blue-500/20 flex items-center space-x-2 text-sm cursor-pointer transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play solution</span>
              </button>
            )}

            {/* Next */}
            <button
              onClick={onNext}
              disabled={currentStep >= totalSteps}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-2xs transition cursor-pointer"
              title="Next step"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Jump to End */}
            <button
              onClick={onJumpFinal}
              disabled={currentStep >= totalSteps}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-2xs transition cursor-pointer"
              title="Jump to goal"
            >
              <FastForward className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Row: Speed Selector [Slow] [Normal] [Fast] */}
          <div className="flex items-center justify-start space-x-1.5 pt-1">
            <button
              onClick={() => onChangeSpeed(1800)}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                speedMs >= 1600
                  ? 'bg-amber-400 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Slow
            </button>
            <button
              onClick={() => onChangeSpeed(1000)}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                speedMs >= 800 && speedMs <= 1400
                  ? 'bg-amber-400 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => onChangeSpeed(500)}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                speedMs <= 600
                  ? 'bg-amber-400 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Fast
            </button>
          </div>
        </div>
      )}

      {/* 5. Solution Steps Section (horizontal scroll list matching screenshot) */}
      <div className="bg-white/80 rounded-2xl p-3 border border-sky-100 shadow-2xs space-y-2.5">
        {/* Title & Keyboard shortcut hint */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-800">Solution steps</span>
          <span className="text-slate-400 font-medium flex items-center space-x-1">
            <span>Tap a step</span>
            <span>&bull;</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10px] font-mono text-slate-600">
              Space
            </kbd>
            <span>play</span>
            <span>&bull;</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10px] font-mono text-slate-600">
              &larr;
            </kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10px] font-mono text-slate-600">
              &rarr;
            </kbd>
            <span>step</span>
          </span>
        </div>

        {/* Horizontal scroll container with step cards */}
        <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {solutionPath.map((node, i) => {
            const isSelected = i === currentStep;
            const stepName =
              i === 0
                ? 'Start'
                : node.action
                ? formatShortActionLabel(node.action.label)
                : `Step ${i}`;

            return (
              <button
                key={node.id}
                onClick={() => onSelectStep(i)}
                className={`shrink-0 flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#0088ff] bg-sky-50 text-slate-900 shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {/* Number Circle */}
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected
                      ? 'bg-[#0088ff] text-white'
                      : 'bg-sky-100 text-slate-600'
                  }`}
                >
                  {i}
                </span>

                {/* Action Title & Tuple */}
                <div className="text-left">
                  <span className="block font-bold leading-tight">
                    {stepName}
                  </span>
                  <span className="block text-[11px] font-mono text-slate-400 font-semibold leading-tight mt-0.5">
                    {formatState(node.state)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

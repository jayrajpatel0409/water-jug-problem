import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  Gauge,
  ListTree,
  HandMetal,
  Snail,
  Rabbit,
} from 'lucide-react';
import { ExecutionMode } from '../hooks/useSearchExecution';

interface ExecutionControlsProps {
  mode: ExecutionMode;
  onSetMode: (mode: ExecutionMode) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRestart: () => void;
  onJumpFinal: () => void;
  currentStep: number;
  totalSteps: number;
  speedMs: number;
  onChangeSpeed: (ms: number) => void;
  isGoalAchieved: boolean;
}

export const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  mode,
  onSetMode,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onRestart,
  onJumpFinal,
  currentStep,
  totalSteps,
  speedMs,
  onChangeSpeed,
  isGoalAchieved,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Mode Switcher */}
      <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => onSetMode('SOLUTION_PLAYBACK')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
            mode === 'SOLUTION_PLAYBACK' || mode === 'SEARCH_TRACE'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Watch the algorithm's sequence of actions"
        >
          <ListTree className="w-3.5 h-3.5" />
          <span>Solution Animation</span>
        </button>

        <button
          onClick={() => onSetMode('MANUAL')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
            mode === 'MANUAL'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Take control and pour water yourself"
        >
          <HandMetal className="w-3.5 h-3.5" />
          <span>Manual Mode</span>
        </button>
      </div>

      {/* Main Playback Buttons */}
      {mode !== 'MANUAL' ? (
        <div className="flex items-center space-x-2">
          <button
            onClick={onRestart}
            disabled={currentStep === 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer border border-slate-700"
            title="Restart to step 0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer border border-slate-700"
            title="Previous move"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {isPlaying ? (
            <button
              onClick={onPause}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              title="Pause animation"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span className="text-xs">Pause</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={totalSteps === 0}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              title="Play pouring animation"
            >
              <Play className="w-4 h-4 fill-current" />
              <span className="text-xs">Play Solution</span>
            </button>
          )}

          <button
            onClick={onNext}
            disabled={currentStep >= totalSteps}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer border border-slate-700"
            title="Next move"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onJumpFinal}
            disabled={currentStep >= totalSteps}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer border border-slate-700"
            title="Jump to goal"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-xs text-slate-400 italic">
          Use the action buttons above to fill, empty, or pour between jugs.
        </div>
      )}

      {/* Speed Controls: Slow / Medium / Fast + Slider */}
      <div className="flex items-center space-x-3 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onChangeSpeed(1800)}
            className={`px-2 py-1 text-[11px] font-semibold rounded transition cursor-pointer ${
              speedMs >= 1600
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Slow, smooth pouring (1.8s)"
          >
            Slow
          </button>
          <button
            onClick={() => onChangeSpeed(1000)}
            className={`px-2 py-1 text-[11px] font-semibold rounded transition cursor-pointer ${
              speedMs >= 900 && speedMs <= 1300
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Normal pouring speed (1.0s)"
          >
            Normal
          </button>
          <button
            onClick={() => onChangeSpeed(500)}
            className={`px-2 py-1 text-[11px] font-semibold rounded transition cursor-pointer ${
              speedMs <= 600
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Fast speed (0.5s)"
          >
            Fast
          </button>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800">
          <input
            type="range"
            min="300"
            max="2500"
            step="100"
            value={speedMs}
            onChange={(e) => onChangeSpeed(parseInt(e.target.value))}
            className="w-20 accent-cyan-400 cursor-pointer"
            title={`Speed: ${(speedMs / 1000).toFixed(1)}s per action`}
          />
          <span className="text-[11px] font-mono text-cyan-300 w-10 text-right">
            {(speedMs / 1000).toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
};

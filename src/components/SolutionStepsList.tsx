import React from 'react';
import {
  CheckCircle2,
  ListOrdered,
  ArrowRight,
  Droplet,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SearchNode, SearchExecutionEvent } from '../core/types';
import { formatState } from '../core/stateTransitions';

interface SolutionStepsListProps {
  solutionPath: SearchNode[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  isGoal: boolean;
}

export const SolutionStepsList: React.FC<SolutionStepsListProps> = ({
  solutionPath,
  currentStepIndex,
  onSelectStep,
  isGoal,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <ListOrdered className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Solution Steps Path</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                {Math.max(0, solutionPath.length - 1)} Moves
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any step to inspect the jugs at that point
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[460px]">
        {solutionPath.map((node, index) => {
          const isActive = index === currentStepIndex;
          const isInitial = index === 0;
          const isFinal = index === solutionPath.length - 1;

          let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
          if (isFinal) {
            badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-700 font-bold';
          } else if (isActive) {
            badgeColor = 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold';
          }

          return (
            <div
              key={node.id}
              onClick={() => onSelectStep(index)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
              }`}
            >
              {/* Left: Step number and action */}
              <div className="flex items-center space-x-2.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono shrink-0 border ${badgeColor}`}
                >
                  {index}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive
                          ? 'text-cyan-300'
                          : isFinal
                          ? 'text-emerald-300 font-bold'
                          : 'text-slate-200'
                      }`}
                    >
                      {isInitial
                        ? 'Initial State (Start)'
                        : node.action?.label || 'Action'}
                    </span>
                    {isFinal && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  {!isInitial && node.action?.amountTransferred && (
                    <span className="text-[10px] text-slate-400 block">
                      Transferred {node.action.amountTransferred}L
                    </span>
                  )}
                </div>
              </div>

              {/* Right: State Vector Pill */}
              <div className="shrink-0 text-right">
                <span
                  className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold border ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                      : isFinal
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-slate-900 text-cyan-300 border-slate-700'
                  }`}
                >
                  {formatState(node.state)}
                </span>
                <span className="text-[9px] text-slate-500 block font-mono mt-0.5">
                  Cost: {node.g}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

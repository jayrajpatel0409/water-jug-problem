import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  Layers,
  GitBranch,
} from 'lucide-react';
import {
  AlgorithmId,
  GoalConfig,
  JugConfiguration,
} from '../core/types';
import { analyzeSolvability } from '../core/solvability';

interface ConfigurationPanelProps {
  config: JugConfiguration;
  onChangeConfig: (newConfig: JugConfiguration) => void;
  selectedAlgorithm: AlgorithmId;
  onSelectAlgorithm: (id: AlgorithmId) => void;
  solutionMovesCount: number;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onChangeConfig,
  selectedAlgorithm,
  onSelectAlgorithm,
  solutionMovesCount,
}) => {
  const solvability = analyzeSolvability(
    config.capacities,
    config.initialState,
    config.goal
  );

  const handleToggleJugCount = (num: 2 | 3) => {
    if (num === 2) {
      onChangeConfig({
        numJugs: 2,
        capacities: [4, 3],
        initialState: [0, 0],
        goal: {
          type: 'ANY_JUG',
          targetAmount: 2,
          selectedJugIndex: 0,
          exactState: [2, 0],
          description: 'Any jug contains 2L',
        },
        operationCosts: { fill: 1, empty: 1, pour: 1 },
      });
    } else {
      onChangeConfig({
        numJugs: 3,
        capacities: [8, 5, 3],
        initialState: [8, 0, 0],
        goal: {
          type: 'SELECTED_JUG',
          targetAmount: 4,
          selectedJugIndex: 0,
          exactState: [4, 4, 0],
          description: 'Jug A contains 4L',
        },
        operationCosts: { fill: 1, empty: 1, pour: 1 },
      });
    }
  };

  const applyPreset = (presetKey: string) => {
    switch (presetKey) {
      case '4-3-2':
        onChangeConfig({
          numJugs: 2,
          capacities: [4, 3],
          initialState: [0, 0],
          goal: {
            type: 'ANY_JUG',
            targetAmount: 2,
            selectedJugIndex: 0,
            exactState: [2, 0],
            description: 'Any jug contains 2L',
          },
          operationCosts: { fill: 1, empty: 1, pour: 1 },
        });
        break;
      case '5-3-4':
        onChangeConfig({
          numJugs: 2,
          capacities: [5, 3],
          initialState: [0, 0],
          goal: {
            type: 'SELECTED_JUG',
            targetAmount: 4,
            selectedJugIndex: 0,
            exactState: [4, 0],
            description: 'Jug A contains 4L',
          },
          operationCosts: { fill: 1, empty: 1, pour: 1 },
        });
        break;
      case '8-5-3-4':
        onChangeConfig({
          numJugs: 3,
          capacities: [8, 5, 3],
          initialState: [8, 0, 0],
          goal: {
            type: 'SELECTED_JUG',
            targetAmount: 4,
            selectedJugIndex: 0,
            exactState: [4, 4, 0],
            description: 'Jug A contains 4L',
          },
          operationCosts: { fill: 1, empty: 1, pour: 1 },
        });
        break;
      case '6-4-3':
        onChangeConfig({
          numJugs: 2,
          capacities: [6, 4],
          initialState: [0, 0],
          goal: {
            type: 'ANY_JUG',
            targetAmount: 3,
            selectedJugIndex: 0,
            exactState: [3, 0],
            description: 'Any jug contains 3L',
          },
          operationCosts: { fill: 1, empty: 1, pour: 1 },
        });
        break;
    }
  };

  const handleCapacityStep = (index: number, delta: number) => {
    const current = config.capacities[index];
    const nextVal = Math.max(1, Math.min(20, current + delta));
    const newCapacities = [...config.capacities];
    newCapacities[index] = nextVal;

    const newGoal = { ...config.goal };
    if (newGoal.targetAmount > Math.max(...newCapacities)) {
      newGoal.targetAmount = Math.min(...newCapacities);
    }

    onChangeConfig({
      ...config,
      capacities: newCapacities,
      goal: newGoal,
    });
  };

  const handleGoalStep = (delta: number) => {
    const maxCap = Math.max(...config.capacities);
    const nextVal = Math.max(1, Math.min(maxCap, config.goal.targetAmount + delta));
    onChangeConfig({
      ...config,
      goal: { ...config.goal, targetAmount: nextVal },
    });
  };

  const isPreset432 =
    config.numJugs === 2 &&
    config.capacities[0] === 4 &&
    config.capacities[1] === 3 &&
    config.goal.targetAmount === 2;

  const isPreset534 =
    config.numJugs === 2 &&
    config.capacities[0] === 5 &&
    config.capacities[1] === 3 &&
    config.goal.targetAmount === 4;

  const isPreset853 =
    config.numJugs === 3 &&
    config.capacities[0] === 8 &&
    config.capacities[1] === 5 &&
    config.capacities[2] === 3 &&
    config.goal.targetAmount === 4;

  const isPreset643 =
    config.numJugs === 2 &&
    config.capacities[0] === 6 &&
    config.capacities[1] === 4 &&
    config.goal.targetAmount === 3;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80">
      {/* 3 Main Numbered Configuration Sections */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SECTION 1: PICK YOUR JUGS */}
        <div className="md:col-span-6 space-y-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#0088ff] text-white flex items-center justify-center font-bold text-[11px]">
              1
            </span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              PICK YOUR JUGS
            </span>
          </div>

          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            {/* 2 jugs / 3 jugs Toggle */}
            <div className="bg-sky-100/60 p-1 rounded-full flex items-center border border-sky-200/50">
              <button
                onClick={() => handleToggleJugCount(2)}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                  config.numJugs === 2
                    ? 'bg-[#0088ff] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2 jugs
              </button>
              <button
                onClick={() => handleToggleJugCount(3)}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                  config.numJugs === 3
                    ? 'bg-[#0088ff] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3 jugs
              </button>
            </div>

            {/* Jug A Stepper */}
            <div className="flex items-center space-x-1.5">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-[#0088ff] font-bold text-xs flex items-center justify-center">
                A
              </span>
              <div className="flex items-center space-x-2 bg-sky-50/60 px-2 py-1 rounded-full border border-sky-200/60 shadow-sm">
                <button
                  onClick={() => handleCapacityStep(0, -1)}
                  className="w-5 h-5 rounded-full bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-xs cursor-pointer"
                >
                  <Minus className="w-3 h-3 stroke-[3]" />
                </button>
                <span className="text-sm font-extrabold text-slate-800 min-w-8 text-center font-mono">
                  {config.capacities[0]} <span className="text-xs font-medium text-slate-500">L</span>
                </span>
                <button
                  onClick={() => handleCapacityStep(0, 1)}
                  className="w-6 h-6 rounded-full bg-[#0088ff] text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-blue-600 transition"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Jug B Stepper */}
            <div className="flex items-center space-x-1.5">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-[#0088ff] font-bold text-xs flex items-center justify-center">
                B
              </span>
              <div className="flex items-center space-x-2 bg-sky-50/60 px-2 py-1 rounded-full border border-sky-200/60 shadow-sm">
                <button
                  onClick={() => handleCapacityStep(1, -1)}
                  className="w-5 h-5 rounded-full bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-xs cursor-pointer"
                >
                  <Minus className="w-3 h-3 stroke-[3]" />
                </button>
                <span className="text-sm font-extrabold text-slate-800 min-w-8 text-center font-mono">
                  {config.capacities[1]} <span className="text-xs font-medium text-slate-500">L</span>
                </span>
                <button
                  onClick={() => handleCapacityStep(1, 1)}
                  className="w-6 h-6 rounded-full bg-[#0088ff] text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-blue-600 transition"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Optional Jug C Stepper */}
            {config.numJugs === 3 && (
              <div className="flex items-center space-x-1.5">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-[#0088ff] font-bold text-xs flex items-center justify-center">
                  C
                </span>
                <div className="flex items-center space-x-2 bg-sky-50/60 px-2 py-1 rounded-full border border-sky-200/60 shadow-sm">
                  <button
                    onClick={() => handleCapacityStep(2, -1)}
                    className="w-5 h-5 rounded-full bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-xs cursor-pointer"
                  >
                    <Minus className="w-3 h-3 stroke-[3]" />
                  </button>
                  <span className="text-sm font-extrabold text-slate-800 min-w-8 text-center font-mono">
                    {config.capacities[2]} <span className="text-xs font-medium text-slate-500">L</span>
                  </span>
                  <button
                    onClick={() => handleCapacityStep(2, 1)}
                    className="w-6 h-6 rounded-full bg-[#0088ff] text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-blue-600 transition"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: GOAL TO MEASURE */}
        <div className="md:col-span-3 space-y-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#0088ff] text-white flex items-center justify-center font-bold text-[11px]">
              2
            </span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              GOAL TO MEASURE
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-emerald-50/70 px-2 py-1 rounded-full border border-emerald-200/70 shadow-sm w-fit">
            <button
              onClick={() => handleGoalStep(-1)}
              className="w-5 h-5 rounded-full bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-xs cursor-pointer"
            >
              <Minus className="w-3 h-3 stroke-[3]" />
            </button>
            <span className="text-base font-black text-emerald-600 min-w-8 text-center font-mono">
              {config.goal.targetAmount} <span className="text-xs font-medium text-emerald-700">L</span>
            </span>
            <button
              onClick={() => handleGoalStep(1)}
              className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-emerald-600 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* SECTION 3: SEARCH METHOD */}
        <div className="md:col-span-3 space-y-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#0088ff] text-white flex items-center justify-center font-bold text-[11px]">
              3
            </span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              SEARCH METHOD
            </span>
          </div>

          <div className="bg-sky-100/60 p-1 rounded-full flex items-center border border-sky-200/50 w-fit">
            <button
              onClick={() => onSelectAlgorithm('BFS')}
              className={`flex items-center space-x-1.5 px-4 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                selectedAlgorithm === 'BFS'
                  ? 'bg-[#0088ff] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>BFS</span>
            </button>
            <button
              onClick={() => onSelectAlgorithm('DFS')}
              className={`flex items-center space-x-1.5 px-4 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                selectedAlgorithm === 'DFS'
                  ? 'bg-[#0088ff] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>DFS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashed Separator */}
      <div className="border-t border-dashed border-slate-200 my-4.5" />

      {/* Bottom Row: Presets & Solvability Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        {/* Presets */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-amber-500 font-bold flex items-center gap-1 uppercase tracking-wider text-[11px]">
            <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
            <span>TRY A LEVEL:</span>
          </span>

          <button
            onClick={() => applyPreset('4-3-2')}
            className={`px-3.5 py-1 rounded-full font-bold transition cursor-pointer ${
              isPreset432
                ? 'bg-white border-2 border-[#0088ff] text-[#0088ff] shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            4 L + 3 L &rarr; 2 L
          </button>

          <button
            onClick={() => applyPreset('5-3-4')}
            className={`px-3.5 py-1 rounded-full font-bold transition cursor-pointer ${
              isPreset534
                ? 'bg-white border-2 border-[#0088ff] text-[#0088ff] shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            5 L + 3 L &rarr; 4 L
          </button>

          <button
            onClick={() => applyPreset('8-5-3-4')}
            className={`px-3.5 py-1 rounded-full font-bold transition cursor-pointer ${
              isPreset853
                ? 'bg-white border-2 border-[#0088ff] text-[#0088ff] shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            8, 5, 3 &rarr; 4 L
          </button>

          <button
            onClick={() => applyPreset('6-4-3')}
            className={`px-3.5 py-1 rounded-full font-bold transition cursor-pointer ${
              isPreset643
                ? 'bg-white border-2 border-[#0088ff] text-[#0088ff] shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            6 L + 4 L &rarr; 3 L
          </button>
        </div>

        {/* Solvability Status Badge */}
        <div>
          {solvability.isSolvable ? (
            <div className="bg-emerald-50 border border-emerald-300/80 px-4 py-1.5 rounded-2xl flex items-center space-x-2.5 shadow-xs">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-slate-800 block text-xs leading-none">
                  Solvable in {solutionMovesCount} moves
                </span>
                <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                  {config.goal.targetAmount} L is a multiple of gcd = {solvability.gcdValue ?? 1}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-300 px-4 py-1.5 rounded-2xl flex items-center space-x-2.5 shadow-xs">
              <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-slate-800 block text-xs leading-none">
                  Mathematically Impossible
                </span>
                <span className="text-[10px] text-rose-700 font-medium block mt-0.5">
                  gcd({config.capacities[0]}, {config.capacities[1]}) = {solvability.gcdValue} does not divide {config.goal.targetAmount}L
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

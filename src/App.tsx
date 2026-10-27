import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AlgorithmId,
  JugAction,
  JugConfiguration,
  JugState,
  SearchResult,
} from './core/types';
import { Header } from './components/Header';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { MetricsPanel } from './components/MetricsPanel';
import { WaterJugView } from './components/WaterJugView';
import { SearchTreeView } from './components/SearchTreeView';
import { HowItWorksModal } from './components/HowItWorksModal';
import { executeAlgorithm } from './algorithms';
import { useSearchExecution } from './hooks/useSearchExecution';

const DEFAULT_CONFIG: JugConfiguration = {
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
  operationCosts: {
    fill: 1,
    empty: 1,
    pour: 1,
  },
};

export function App() {
  const [mode, setMode] = useState<'WATCH' | 'PLAY'>('WATCH');
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [config, setConfig] = useState<JugConfiguration>(DEFAULT_CONFIG);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmId>('BFS');

  // Compute search result
  const searchResult: SearchResult = useMemo(() => {
    return executeAlgorithm(selectedAlgorithm, config);
  }, [selectedAlgorithm, config]);

  const execution = useSearchExecution(searchResult, config);

  const solutionNodeIds = useMemo(
    () => new Set(searchResult.solutionPath.map((n) => n.id)),
    [searchResult.solutionPath]
  );

  const solutionMovesCount = useMemo(() => {
    return Math.max(0, searchResult.solutionPath.length - 1);
  }, [searchResult.solutionPath]);

  // Synchronize execution mode when user switches between Watch & Play
  const handleSetMode = useCallback(
    (newMode: 'WATCH' | 'PLAY') => {
      setMode(newMode);
      if (newMode === 'PLAY') {
        execution.setMode('MANUAL');
      } else {
        execution.setMode('SOLUTION_PLAYBACK');
      }
    },
    [execution]
  );

  // Jump simulation to node when clicked in tree
  const handleSelectTreeNode = useCallback(
    (state: JugState, _action: JugAction | null, solIndex?: number) => {
      execution.pause();
      if (solIndex !== undefined) {
        if (execution.mode !== 'SOLUTION_PLAYBACK') {
          execution.setMode('SOLUTION_PLAYBACK');
        }
        execution.jumpToStep(solIndex);
      } else {
        const stepIdx = searchResult.events.findIndex(
          (e) =>
            e.activeState.length === state.length &&
            e.activeState.every((val, i) => val === state[i])
        );
        if (stepIdx >= 0) {
          execution.jumpToStep(stepIdx);
        }
      }
    },
    [execution, searchResult.events]
  );

  // Keyboard navigation shortcuts: Space (play/pause), ArrowLeft (prev), ArrowRight (next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (execution.isPlaying) {
          execution.pause();
        } else {
          execution.play();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        execution.pause();
        execution.prevStep();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        execution.pause();
        execution.nextStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [execution]);

  return (
    <div className="min-h-screen bg-[#e8f7fd] text-slate-800 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900">
      {/* 1. Top Header */}
      <Header
        mode={mode}
        onSetMode={handleSetMode}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      {/* 2. Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 space-y-4 pt-1 pb-6">
        {/* Top Configuration Card */}
        <ConfigurationPanel
          config={config}
          onChangeConfig={setConfig}
          selectedAlgorithm={selectedAlgorithm}
          onSelectAlgorithm={setSelectedAlgorithm}
          solutionMovesCount={solutionMovesCount}
        />

        {/* 5-Card Metrics Row */}
        <MetricsPanel
          metrics={searchResult.metrics}
          solutionMovesCount={solutionMovesCount}
          found={searchResult.found}
        />

        {/* Dual Layout: Watch the Solution (Left) & Search Tree (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Solution Player / Jugs */}
          <div className="lg:col-span-6 flex flex-col">
            <WaterJugView
              state={execution.activeState}
              capacities={config.capacities}
              goalAmount={config.goal.targetAmount}
              activeAction={execution.activeAction}
              isGoal={execution.isGoalAchieved}
              manualMode={mode === 'PLAY'}
              onApplyManualAction={execution.applyManualAction}
              manualMoveCount={execution.manualMoveCount}
              onResetManual={execution.resetManualMode}
              speedMs={execution.speedMs}
              onChangeSpeed={execution.setSpeedMs}
              isPlaying={execution.isPlaying}
              onPlay={execution.play}
              onPause={execution.pause}
              onNext={execution.nextStep}
              onPrev={execution.prevStep}
              onRestart={execution.restart}
              onJumpFinal={execution.jumpToFinal}
              currentStep={execution.currentStepIndex}
              totalSteps={execution.totalSteps}
              solutionPath={searchResult.solutionPath}
              onSelectStep={(stepIdx) => {
                execution.pause();
                execution.jumpToStep(stepIdx);
              }}
            />
          </div>

          {/* Right Column: Search Tree */}
          <div className="lg:col-span-6 flex flex-col">
            <SearchTreeView
              nodes={searchResult.treeNodes}
              edges={searchResult.treeEdges}
              activeNodeId={execution.activeNode?.id}
              activeState={execution.activeState}
              activeAction={execution.activeAction}
              currentStepIndex={execution.currentStepIndex}
              solutionNodeIds={solutionNodeIds}
              solutionPath={searchResult.solutionPath}
              onSelectNode={handleSelectTreeNode}
            />
          </div>
        </div>
      </main>

      {/* Bottom Footer Bar */}
      <footer className="mt-6 border-t border-sky-200/60 py-4 px-6 bg-[#e8f7fd]/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-medium text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-800">AquaMind</span>
            <span>&mdash;</span>
            <span>water jug puzzle solver &amp; search visualizer</span>
          </div>
          <div>
            <span>Everything runs right in your browser</span>
          </div>
        </div>
      </footer>

      {/* How it Works Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </div>
  );
}

export default App;

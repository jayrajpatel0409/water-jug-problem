import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  JugAction,
  JugConfiguration,
  JugState,
  SearchExecutionEvent,
  SearchResult,
  VisualSearchNode,
} from '../core/types';
import { applyAction, formatState } from '../core/stateTransitions';
import { isGoalReached } from '../core/goalTests';

export type ExecutionMode = 'SEARCH_TRACE' | 'SOLUTION_PLAYBACK' | 'MANUAL';

export interface UseSearchExecutionReturn {
  mode: ExecutionMode;
  setMode: (mode: ExecutionMode) => void;
  isPlaying: boolean;
  speedMs: number;
  setSpeedMs: (speed: number) => void;
  currentStepIndex: number;
  totalSteps: number;
  activeState: JugState;
  activeNode: VisualSearchNode | null;
  activeAction: JugAction | null;
  activeExplanation: string;
  isGoalAchieved: boolean;
  play: () => void;
  pause: () => void;
  nextStep: () => void;
  prevStep: () => void;
  restart: () => void;
  jumpToFinal: () => void;
  jumpToStep: (index: number) => void;
  applyManualAction: (action: JugAction) => void;

  manualMoveCount: number;
  manualHistory: Array<{ state: JugState; action: JugAction }>;
  resetManualMode: () => void;
}

export function useSearchExecution(
  searchResult: SearchResult,
  config: JugConfiguration
): UseSearchExecutionReturn {
  const [mode, setMode] = useState<ExecutionMode>('SOLUTION_PLAYBACK');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(1200);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);


  // Manual mode state
  const [manualState, setManualState] = useState<JugState>(config.initialState);
  const [manualHistory, setManualHistory] = useState<
    Array<{ state: JugState; action: JugAction }>
  >([]);

  const timerRef = useRef<number | null>(null);

  // Reset steps whenever searchResult changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setManualState([...config.initialState]);
    setManualHistory([]);
  }, [searchResult, config.initialState]);

  // Total steps depending on mode
  const totalSteps =
    mode === 'SEARCH_TRACE'
      ? Math.max(0, searchResult.events.length - 1)
      : mode === 'SOLUTION_PLAYBACK'
      ? Math.max(0, searchResult.solutionPath.length - 1)
      : manualHistory.length;

  // Determine current active state, node, action, and explanation
  let activeState: JugState = config.initialState;
  let activeNode: VisualSearchNode | null = null;
  let activeAction: JugAction | null = null;
  let activeExplanation = '';
  let isGoalAchieved = false;

  if (mode === 'SEARCH_TRACE') {
    const event: SearchExecutionEvent | undefined =
      searchResult.events[currentStepIndex];
    if (event) {
      activeState = event.activeState;
      activeAction = event.actionTaken;
      activeExplanation = event.explanation;
      isGoalAchieved = event.isGoal;
      const foundNode = searchResult.treeNodes.find(
        (n) => n.id === event.node.id
      );
      activeNode = foundNode || null;
    }
  } else if (mode === 'SOLUTION_PLAYBACK') {
    const node = searchResult.solutionPath[currentStepIndex];
    if (node) {
      activeState = node.state;
      activeAction = node.action;
      const foundNode = searchResult.treeNodes.find((n) => n.id === node.id);
      activeNode = foundNode || null;
      isGoalAchieved = isGoalReached(node.state, config.goal);

      if (currentStepIndex === 0) {
        activeExplanation = `Start of solution path at initial state ${formatState(node.state)}.`;
      } else {
        activeExplanation = `Step ${currentStepIndex}: Performed "${node.action?.label}". New state reached: ${formatState(node.state)}. (Cumulative cost: ${node.g})`;
      }
    }
  } else {
    // MANUAL mode
    activeState = manualState;
    isGoalAchieved = isGoalReached(manualState, config.goal);
    if (manualHistory.length > 0) {
      const last = manualHistory[manualHistory.length - 1];
      activeAction = last.action;
      activeExplanation = `Manual Move ${manualHistory.length}: ${last.action.label}. Current water state: ${formatState(manualState)}.`;
    } else {
      activeExplanation = `Manual Laboratory Mode: Use the action buttons to fill, empty, or pour water. Initial state: ${formatState(manualState)}.`;
    }
  }

  // Trigger celebration confetti when goal reached
  useEffect(() => {
    if (isGoalAchieved) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#0ea5e9', '#3b82f6', '#10b981', '#f59e0b'],
        });
      } catch {
        // Safe fallback in test environments
      }
    }
  }, [isGoalAchieved]);

  // Controls
  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev < totalSteps) return prev + 1;
      setIsPlaying(false);
      return prev;
    });
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const restart = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  const jumpToFinal = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(totalSteps);
  }, [totalSteps]);

  const jumpToStep = useCallback((index: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.max(0, Math.min(totalSteps, index)));
  }, [totalSteps]);


  const play = useCallback(() => {
    if (currentStepIndex >= totalSteps) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [currentStepIndex, totalSteps]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Interval timer for playback
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < totalSteps) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, speedMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalSteps, speedMs]);

  // Manual actions
  const applyManualAction = useCallback(
    (action: JugAction) => {
      setManualState((prev) => {
        const next = applyAction(prev, action, config.capacities);
        setManualHistory((h) => [...h, { state: next, action }]);
        return next;
      });
    },
    [config.capacities]
  );

  const resetManualMode = useCallback(() => {
    setManualState([...config.initialState]);
    setManualHistory([]);
  }, [config.initialState]);

  return {
    mode,
    setMode,
    isPlaying,
    speedMs,
    setSpeedMs,
    currentStepIndex,
    totalSteps,
    activeState,
    activeNode,
    activeAction,
    activeExplanation,
    isGoalAchieved,
    play,
    pause,
    nextStep,
    prevStep,
    restart,
    jumpToFinal,
    jumpToStep,
    applyManualAction,

    manualMoveCount: manualHistory.length,
    manualHistory,
    resetManualMode,
  };
}

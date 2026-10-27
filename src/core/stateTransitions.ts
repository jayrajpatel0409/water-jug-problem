import { JugState, JugAction, ActionType } from './types';

export const JUG_LABELS = ['A', 'B', 'C'] as const;

export function encodeState(state: JugState): string {
  return state.join(',');
}

export function decodeState(key: string): JugState {
  return key.split(',').map(Number);
}

export function formatState(state: JugState): string {
  return `(${state.join(', ')})`;
}

export function areStatesEqual(a: JugState, b: JugState): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export interface TransitionResult {
  action: JugAction;
  nextState: JugState;
}

export interface OperationCostConfig {
  fill: number;
  empty: number;
  pour: number;
}

export const DEFAULT_OPERATION_COSTS: OperationCostConfig = {
  fill: 1,
  empty: 1,
  pour: 1,
};

/**
 * Generates all valid transitions from the given state under capacity constraints.
 * Order of actions: Fill actions, Empty actions, Pour actions.
 * Deterministic ordering guarantees repeatable search trees.
 */
export function getValidTransitions(
  state: JugState,
  capacities: number[],
  costs: OperationCostConfig = DEFAULT_OPERATION_COSTS
): TransitionResult[] {
  const transitions: TransitionResult[] = [];
  const numJugs = capacities.length;

  // 1. FILL operations: Fill jug i if not full
  for (let i = 0; i < numJugs; i++) {
    if (state[i] < capacities[i]) {
      const next = [...state];
      next[i] = capacities[i];
      const jugLetter = JUG_LABELS[i];
      const action: JugAction = {
        type: 'FILL',
        jugIndex: i,
        cost: costs.fill,
        label: `Fill Jug ${jugLetter}`,
        description: `Fill Jug ${jugLetter} from ${state[i]}L to full capacity (${capacities[i]}L).`,
      };
      transitions.push({ action, nextState: next });
    }
  }

  // 2. EMPTY operations: Empty jug i if not empty
  for (let i = 0; i < numJugs; i++) {
    if (state[i] > 0) {
      const next = [...state];
      next[i] = 0;
      const jugLetter = JUG_LABELS[i];
      const action: JugAction = {
        type: 'EMPTY',
        jugIndex: i,
        cost: costs.empty,
        label: `Empty Jug ${jugLetter}`,
        description: `Empty Jug ${jugLetter} (${state[i]}L poured out).`,
      };
      transitions.push({ action, nextState: next });
    }
  }

  // 3. POUR operations: Pour from jug i to jug j (i !== j)
  for (let i = 0; i < numJugs; i++) {
    if (state[i] <= 0) continue; // Jug i is empty, cannot pour

    for (let j = 0; j < numJugs; j++) {
      if (i === j) continue;
      if (state[j] >= capacities[j]) continue; // Jug j is full, cannot accept water

      const availableSpaceInJ = capacities[j] - state[j];
      const amountToPour = Math.min(state[i], availableSpaceInJ);

      if (amountToPour > 0) {
        const next = [...state];
        next[i] = state[i] - amountToPour;
        next[j] = state[j] + amountToPour;

        const fromLetter = JUG_LABELS[i];
        const toLetter = JUG_LABELS[j];
        const action: JugAction = {
          type: 'POUR',
          fromJug: i,
          toJug: j,
          amountTransferred: amountToPour,
          cost: costs.pour,
          label: `Pour ${fromLetter} → ${toLetter}`,
          description: `Pour ${amountToPour}L from Jug ${fromLetter} into Jug ${toLetter}.`,
        };
        transitions.push({ action, nextState: next });
      }
    }
  }

  return transitions;
}

/**
 * Apply a specific single action manually
 */
export function applyAction(
  state: JugState,
  action: JugAction,
  capacities: number[]
): JugState {
  const next = [...state];
  if (action.type === 'FILL' && action.jugIndex !== undefined) {
    next[action.jugIndex] = capacities[action.jugIndex];
  } else if (action.type === 'EMPTY' && action.jugIndex !== undefined) {
    next[action.jugIndex] = 0;
  } else if (
    action.type === 'POUR' &&
    action.fromJug !== undefined &&
    action.toJug !== undefined
  ) {
    const space = capacities[action.toJug] - state[action.toJug];
    const amount = Math.min(state[action.fromJug], space);
    next[action.fromJug] -= amount;
    next[action.toJug] += amount;
  }
  return next;
}

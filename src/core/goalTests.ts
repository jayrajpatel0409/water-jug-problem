import { JugState, GoalConfig } from './types';
import { areStatesEqual, formatState, JUG_LABELS } from './stateTransitions';

export function isGoalReached(state: JugState, goal: GoalConfig): boolean {
  switch (goal.type) {
    case 'ANY_JUG':
      return state.some((amount) => amount === goal.targetAmount);

    case 'SELECTED_JUG':
      return state[goal.selectedJugIndex] === goal.targetAmount;

    case 'EXACT_STATE':
      return areStatesEqual(state, goal.exactState);

    default:
      return false;
  }
}

export function formatGoalDescription(goal: GoalConfig, capacities: number[]): string {
  switch (goal.type) {
    case 'ANY_JUG':
      return `Any jug contains exactly ${goal.targetAmount}L`;
    case 'SELECTED_JUG': {
      const jugName = JUG_LABELS[goal.selectedJugIndex] || `Jug ${goal.selectedJugIndex + 1}`;
      return `Jug ${jugName} contains exactly ${goal.targetAmount}L`;
    }
    case 'EXACT_STATE':
      return `Exact target configuration: ${formatState(goal.exactState)}`;
    default:
      return 'Unknown goal';
  }
}

/**
 * Admissible heuristic function h(n) for A* and Greedy Best-First Search.
 * An admissible heuristic never overestimates the actual cost to reach the goal.
 *
 * For uniform unit cost:
 * - If goal is reached: h = 0
 * - If any single operation (fill, empty, or pour) can reach the goal in 1 step: h = 1
 * - Otherwise: h >= 2
 */
export function calculateHeuristic(
  state: JugState,
  goal: GoalConfig,
  capacities: number[]
): number {
  if (isGoalReached(state, goal)) {
    return 0;
  }

  switch (goal.type) {
    case 'ANY_JUG': {
      const target = goal.targetAmount;
      // If target is 0 and we are not in goal (which means all are 0? wait, if target is 0, any jug has 0)
      let minOperations = 1;

      // Check if any jug can reach target with 1 fill or 1 empty
      for (let i = 0; i < capacities.length; i++) {
        if (target === capacities[i] || target === 0) {
          return 1; // Can reach in 1 fill or empty
        }
      }

      // Check if 1 pour can produce target
      for (let i = 0; i < state.length; i++) {
        for (let j = 0; j < state.length; j++) {
          if (i === j) continue;
          const transfer = Math.min(state[i], capacities[j] - state[j]);
          if (transfer > 0) {
            if (state[i] - transfer === target || state[j] + transfer === target) {
              return 1;
            }
          }
        }
      }

      // Under unit cost, if not reachable in 1 step, at least 2 steps are required.
      return 2;
    }

    case 'SELECTED_JUG': {
      const jugIdx = goal.selectedJugIndex;
      const current = state[jugIdx];
      const target = goal.targetAmount;

      if (current === target) return 0;
      if (target === capacities[jugIdx] || target === 0) return 1;

      // Check 1 pour into or out of selected jug
      for (let other = 0; other < state.length; other++) {
        if (other === jugIdx) continue;
        // Pour from other to jugIdx
        const inTransfer = Math.min(state[other], capacities[jugIdx] - current);
        if (current + inTransfer === target && inTransfer > 0) return 1;

        // Pour from jugIdx to other
        const outTransfer = Math.min(current, capacities[other] - state[other]);
        if (current - outTransfer === target && outTransfer > 0) return 1;
      }

      return 2;
    }

    case 'EXACT_STATE': {
      let differences = 0;
      for (let i = 0; i < state.length; i++) {
        if (state[i] !== goal.exactState[i]) {
          differences++;
        }
      }
      if (differences === 0) return 0;
      // Each operation alters at most 2 jugs
      return Math.ceil(differences / 2);
    }

    default:
      return 1;
  }
}

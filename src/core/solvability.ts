import { GoalConfig, JugState, SolvabilityAnalysis } from './types';
import { encodeState, getValidTransitions } from './stateTransitions';
import { isGoalReached } from './goalTests';

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

/**
 * Analyzes whether a Water Jug puzzle configuration is solvable.
 * Uses Bézout's identity for 2 jugs and reachability search for 3 jugs.
 */
export function analyzeSolvability(
  capacities: number[],
  initialState: JugState,
  goal: GoalConfig
): SolvabilityAnalysis {
  const numJugs = capacities.length;
  const totalPossibleStates = capacities.reduce((acc, cap) => acc * (cap + 1), 1);

  if (isGoalReached(initialState, goal)) {
    return {
      isSolvable: true,
      reason: 'Initial state already satisfies the goal.',
      reachableStatesCount: 1,
      totalPossibleStates,
    };
  }

  // Capacity boundary check
  if (goal.type === 'ANY_JUG') {
    const maxCapacity = Math.max(...capacities);
    if (goal.targetAmount > maxCapacity) {
      return {
        isSolvable: false,
        reason: `Target (${goal.targetAmount}L) exceeds maximum capacity (${maxCapacity}L).`,
        reachableStatesCount: 0,
        totalPossibleStates,
      };
    }
  } else if (goal.type === 'SELECTED_JUG') {
    const targetCap = capacities[goal.selectedJugIndex];
    if (goal.targetAmount > targetCap) {
      return {
        isSolvable: false,
        reason: `Target (${goal.targetAmount}L) exceeds Jug capacity (${targetCap}L).`,
        reachableStatesCount: 0,
        totalPossibleStates,
      };
    }
  }

  // Classic 2-jug GCD check (Bézout's identity)
  let gcdVal: number | undefined;
  if (numJugs === 2 && goal.type === 'ANY_JUG') {
    gcdVal = gcd(capacities[0], capacities[1]);
    const d = goal.targetAmount;
    if (d % gcdVal !== 0) {
      return {
        isSolvable: false,
        reason: `Target ${d}L is not divisible by gcd(${capacities[0]}, ${capacities[1]}) = ${gcdVal} (Bézout's Lemma).`,
        gcdValue: gcdVal,
        reachableStatesCount: 0,
        totalPossibleStates,
      };
    }
  }

  // State-space reachability check
  const visited = new Set<string>();
  const queue: JugState[] = [initialState];
  visited.add(encodeState(initialState));
  let goalReachable = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (isGoalReached(current, goal)) {
      goalReachable = true;
    }
    const transitions = getValidTransitions(current, capacities);
    for (const { nextState } of transitions) {
      const key = encodeState(nextState);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(nextState);
      }
    }
  }

  return {
    isSolvable: goalReachable,
    reason: goalReachable
      ? `Solvable: Path exists to reach the goal (${visited.size} states explored).`
      : 'Unsolvable: No sequence of valid operations can produce this amount.',
    gcdValue: gcdVal,
    reachableStatesCount: visited.size,
    totalPossibleStates,
  };
}

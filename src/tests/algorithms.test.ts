import { describe, it, expect } from 'vitest';
import { runBFS } from '../algorithms/bfs';
import { runDFS } from '../algorithms/dfs';
import { runUCS } from '../algorithms/uniformCost';
import { runGreedy } from '../algorithms/greedy';
import { runAStar } from '../algorithms/astar';
import { GoalConfig } from '../core/types';
import { applyAction } from '../core/stateTransitions';

const classicGoal: GoalConfig = {
  type: 'ANY_JUG',
  targetAmount: 2,
  selectedJugIndex: 0,
  exactState: [2, 0],
  description: 'Any 2L',
};

describe('Core AI Search Algorithms Implementation', () => {
  it('BFS finds the optimal minimum-move solution path', () => {
    const capacities = [4, 3];
    const initial = [0, 0];
    const result = runBFS(capacities, initial, classicGoal);

    expect(result.found).toBe(true);
    expect(result.solutionPath.length).toBeGreaterThan(0);
    const moves = result.solutionPath.length - 1;
    expect(moves).toBeLessThanOrEqual(6);
    expect(result.terminationReason).toBe('GOAL_FOUND');
  });

  it('verifies parent-pointer chain is unbroken and executable', () => {
    const capacities = [4, 3];
    const initial = [0, 0];
    const result = runBFS(capacities, initial, classicGoal);

    expect(result.found).toBe(true);
    let currentState = [...initial];

    for (let i = 0; i < result.solutionActions.length; i++) {
      const action = result.solutionActions[i];
      const nextState = applyAction(currentState, action, capacities);
      const expectedRecordedState = result.solutionPath[i + 1].state;
      expect(nextState).toEqual(expectedRecordedState);
      currentState = nextState;
    }

    expect(currentState.some((a) => a === 2)).toBe(true);
  });

  it('DFS prevents infinite cycles and explores finite state space', () => {
    const capacities = [4, 3];
    const initial = [0, 0];
    const result = runDFS(capacities, initial, classicGoal);

    expect(result.found).toBe(true);
    expect(result.metrics.expandedStates).toBeGreaterThan(0);
    expect(result.events.length).toBeGreaterThan(0);
  });

  it('UCS orders frontier by path cost and finds optimal path', () => {
    const capacities = [4, 3];
    const initial = [0, 0];
    const result = runUCS(capacities, initial, classicGoal);

    expect(result.found).toBe(true);
    expect(result.totalCost).toBeGreaterThan(0);
  });

  it('Greedy Best-First Search uses heuristic prioritization', () => {
    const capacities = [4, 3];
    const initial = [0, 0];
    const result = runGreedy(capacities, initial, classicGoal);

    expect(result.found).toBe(true);
    expect(result.solutionPath.length).toBeGreaterThan(0);
  });

  it('A* Search finds optimal solution using f(n) = g(n) + h(n)', () => {
    const capacities = [4, 3];
    const initial = [0, 0];
    const result = runAStar(capacities, initial, classicGoal);

    expect(result.found).toBe(true);
    const moves = result.solutionPath.length - 1;
    expect(moves).toBeLessThanOrEqual(6);

    result.solutionPath.forEach((node) => {
      expect(node.f).toBe(node.g + node.h);
    });
  });

  it('correctly reports failure for mathematically impossible goals', () => {
    const impossibleGoal: GoalConfig = {
      type: 'ANY_JUG',
      targetAmount: 3,
      selectedJugIndex: 0,
      exactState: [3, 0],
      description: 'Any 3L in [6, 4]',
    };

    const capacities = [6, 4];
    const initial = [0, 0];
    const result = runBFS(capacities, initial, impossibleGoal);

    expect(result.found).toBe(false);
    expect(result.terminationReason).toBe('EXHAUSTED');
    expect(result.solutionPath).toHaveLength(0);
  });
});

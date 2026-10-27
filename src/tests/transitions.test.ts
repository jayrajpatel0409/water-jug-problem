import { describe, it, expect } from 'vitest';
import {
  getValidTransitions,
  applyAction,
  encodeState,
  decodeState,
  formatState,
  areStatesEqual,
} from '../core/stateTransitions';
import { isGoalReached } from '../core/goalTests';
import { GoalConfig, JugAction } from '../core/types';

describe('Water Jug State Transitions Engine', () => {
  it('correctly fills an empty or partially filled jug to maximum capacity', () => {
    const capacities = [4, 3];
    const state = [1, 0];
    const transitions = getValidTransitions(state, capacities);

    const fillA = transitions.find(
      (t) => t.action.type === 'FILL' && t.action.jugIndex === 0
    );
    expect(fillA).toBeDefined();
    expect(fillA?.nextState).toEqual([4, 0]);

    const fillB = transitions.find(
      (t) => t.action.type === 'FILL' && t.action.jugIndex === 1
    );
    expect(fillB).toBeDefined();
    expect(fillB?.nextState).toEqual([1, 3]);
  });

  it('does NOT generate a FILL action for an already full jug', () => {
    const capacities = [4, 3];
    const state = [4, 1];
    const transitions = getValidTransitions(state, capacities);

    const fillA = transitions.find(
      (t) => t.action.type === 'FILL' && t.action.jugIndex === 0
    );
    expect(fillA).toBeUndefined();
  });

  it('correctly empties a non-empty jug to zero', () => {
    const capacities = [4, 3];
    const state = [3, 2];
    const transitions = getValidTransitions(state, capacities);

    const emptyA = transitions.find(
      (t) => t.action.type === 'EMPTY' && t.action.jugIndex === 0
    );
    expect(emptyA).toBeDefined();
    expect(emptyA?.nextState).toEqual([0, 2]);

    const emptyB = transitions.find(
      (t) => t.action.type === 'EMPTY' && t.action.jugIndex === 1
    );
    expect(emptyB).toBeDefined();
    expect(emptyB?.nextState).toEqual([3, 0]);
  });

  it('does NOT generate an EMPTY action for an already empty jug', () => {
    const capacities = [4, 3];
    const state = [0, 2];
    const transitions = getValidTransitions(state, capacities);

    const emptyA = transitions.find(
      (t) => t.action.type === 'EMPTY' && t.action.jugIndex === 0
    );
    expect(emptyA).toBeUndefined();
  });

  it('correctly pours between two jugs until source is empty or target is full', () => {
    const capacities = [4, 3];

    // Pour A into B when B has room for everything in A
    const state1 = [2, 0];
    const transitions1 = getValidTransitions(state1, capacities);
    const pourAtoB_1 = transitions1.find(
      (t) => t.action.type === 'POUR' && t.action.fromJug === 0 && t.action.toJug === 1
    );
    expect(pourAtoB_1).toBeDefined();
    expect(pourAtoB_1?.nextState).toEqual([0, 2]);
    expect(pourAtoB_1?.action.amountTransferred).toBe(2);

    // Pour A into B when B capacity is reached before A is empty
    const state2 = [4, 1]; // B only has space for 3 - 1 = 2L
    const transitions2 = getValidTransitions(state2, capacities);
    const pourAtoB_2 = transitions2.find(
      (t) => t.action.type === 'POUR' && t.action.fromJug === 0 && t.action.toJug === 1
    );
    expect(pourAtoB_2).toBeDefined();
    expect(pourAtoB_2?.nextState).toEqual([2, 3]);
    expect(pourAtoB_2?.action.amountTransferred).toBe(2);
  });

  it('does NOT generate a POUR action into a jug that is already full', () => {
    const capacities = [4, 3];
    const state = [2, 3]; // B is full
    const transitions = getValidTransitions(state, capacities);

    const pourAtoB = transitions.find(
      (t) => t.action.type === 'POUR' && t.action.fromJug === 0 && t.action.toJug === 1
    );
    expect(pourAtoB).toBeUndefined();
  });

  it('handles all ordered pairs of pouring in three-jug configurations', () => {
    const capacities = [8, 5, 3];
    const state = [4, 2, 1]; // all have water and available space
    const transitions = getValidTransitions(state, capacities);

    const pourPairs = transitions
      .filter((t) => t.action.type === 'POUR')
      .map((t) => `${t.action.fromJug}->${t.action.toJug}`);

    // All 6 ordered pairs among 3 jugs: (0->1, 0->2, 1->0, 1->2, 2->0, 2->1)
    expect(pourPairs).toContain('0->1');
    expect(pourPairs).toContain('0->2');
    expect(pourPairs).toContain('1->0');
    expect(pourPairs).toContain('1->2');
    expect(pourPairs).toContain('2->0');
    expect(pourPairs).toContain('2->1');
  });

  it('correctly evaluates goal state predicates for ANY, SELECTED, and EXACT', () => {
    const goalAny: GoalConfig = {
      type: 'ANY_JUG',
      targetAmount: 2,
      selectedJugIndex: 0,
      exactState: [2, 0],
      description: 'Any 2L',
    };
    expect(isGoalReached([0, 2], goalAny)).toBe(true);
    expect(isGoalReached([2, 0], goalAny)).toBe(true);
    expect(isGoalReached([1, 1], goalAny)).toBe(false);

    const goalSelected: GoalConfig = {
      type: 'SELECTED_JUG',
      targetAmount: 4,
      selectedJugIndex: 0,
      exactState: [4, 0, 0],
      description: 'Jug A has 4L',
    };
    expect(isGoalReached([4, 1, 0], goalSelected)).toBe(true);
    expect(isGoalReached([2, 4, 0], goalSelected)).toBe(false);

    const goalExact: GoalConfig = {
      type: 'EXACT_STATE',
      targetAmount: 0,
      selectedJugIndex: 0,
      exactState: [4, 4, 0],
      description: 'Exact (4, 4, 0)',
    };
    expect(isGoalReached([4, 4, 0], goalExact)).toBe(true);
    expect(isGoalReached([4, 3, 1], goalExact)).toBe(false);
  });
});

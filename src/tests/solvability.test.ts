import { describe, it, expect } from 'vitest';
import { analyzeSolvability, gcd } from '../core/solvability';
import { GoalConfig } from '../core/types';

describe('Number Theory & Solvability Analysis', () => {
  it('correctly calculates Euclidean GCD', () => {
    expect(gcd(4, 3)).toBe(1);
    expect(gcd(6, 4)).toBe(2);
    expect(gcd(12, 8)).toBe(4);
    expect(gcd(15, 25)).toBe(5);
  });

  it('proves classic 4L & 3L -> 2L is solvable', () => {
    const goal: GoalConfig = {
      type: 'ANY_JUG',
      targetAmount: 2,
      selectedJugIndex: 0,
      exactState: [2, 0],
      description: 'Any 2L',
    };
    const analysis = analyzeSolvability([4, 3], [0, 0], goal);
    expect(analysis.isSolvable).toBe(true);
    expect(analysis.gcdValue).toBe(1);
  });

  it('proves Die Hard 5L & 3L -> 4L is solvable', () => {
    const goal: GoalConfig = {
      type: 'ANY_JUG',
      targetAmount: 4,
      selectedJugIndex: 0,
      exactState: [4, 0],
      description: 'Any 4L',
    };
    const analysis = analyzeSolvability([5, 3], [0, 0], goal);
    expect(analysis.isSolvable).toBe(true);
    expect(analysis.gcdValue).toBe(1);
  });

  it('proves 6L & 4L -> 3L is mathematically IMPOSSIBLE (gcd(6,4)=2 does not divide 3)', () => {
    const goal: GoalConfig = {
      type: 'ANY_JUG',
      targetAmount: 3,
      selectedJugIndex: 0,
      exactState: [3, 0],
      description: 'Any 3L',
    };
    const analysis = analyzeSolvability([6, 4], [0, 0], goal);
    expect(analysis.isSolvable).toBe(false);
    expect(analysis.gcdValue).toBe(2);
    expect(analysis.reason).toContain('Bézout');
  });

  it('rejects targets that exceed maximum jug capacity', () => {
    const goal: GoalConfig = {
      type: 'ANY_JUG',
      targetAmount: 10,
      selectedJugIndex: 0,
      exactState: [10, 0],
      description: 'Any 10L',
    };
    const analysis = analyzeSolvability([4, 3], [0, 0], goal);
    expect(analysis.isSolvable).toBe(false);
    expect(analysis.reason).toContain('exceeds maximum capacity');
  });


  it('correctly validates three-jug 8L, 5L, 3L state space reachability', () => {
    const goal: GoalConfig = {
      type: 'SELECTED_JUG',
      targetAmount: 4,
      selectedJugIndex: 0,
      exactState: [4, 4, 0],
      description: 'Jug A has 4L',
    };
    const analysis = analyzeSolvability([8, 5, 3], [8, 0, 0], goal);
    expect(analysis.isSolvable).toBe(true);
    expect(analysis.reachableStatesCount).toBeGreaterThan(0);
  });
});

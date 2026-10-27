import {
  AlgorithmId,
  AlgorithmInfo,
  JugConfiguration,
  SearchResult,
} from '../core/types';
import { runBFS } from './bfs';
import { runDFS } from './dfs';
import { runUCS } from './uniformCost';
import { runGreedy } from './greedy';
import { runAStar } from './astar';

export const ALGORITHM_CATALOG: Record<AlgorithmId, AlgorithmInfo> = {
  BFS: {
    id: 'BFS',
    name: 'Breadth-First Search',
    category: 'Uninformed',
    frontierType: 'FIFO Queue',
    description: 'Systematically explores level by level. Guarantees the shortest sequence of actions.',
    strategy: 'FIFO Queue: First state discovered is first state expanded.',
  },
  DFS: {
    id: 'DFS',
    name: 'Depth-First Search',
    category: 'Uninformed',
    frontierType: 'LIFO Stack',
    description: 'Explores deeply along one branch before backtracking. Uses minimal memory.',
    strategy: 'LIFO Stack: Deepest active state is expanded first.',
  },
  ASTAR: {
    id: 'ASTAR',
    name: 'A* Search (Optimal Heuristic)',
    category: 'Informed',
    frontierType: 'Priority Queue (f = g + h)',
    description: 'Uses path cost g(n) + heuristic estimate h(n) to find optimal path efficiently.',
    strategy: 'Priority Queue ordered by lowest total estimated cost f(n) = g(n) + h(n).',
  },
  UCS: {
    id: 'UCS',
    name: 'Uniform-Cost Search (Dijkstra)',
    category: 'Uninformed',
    frontierType: 'Priority Queue (g)',
    description: 'Expands the lowest-cost state first. Guarantees minimum total cost.',
    strategy: 'Priority Queue ordered by cumulative path cost g(n).',
  },
  GREEDY: {
    id: 'GREEDY',
    name: 'Greedy Best-First Search',
    category: 'Informed',
    frontierType: 'Priority Queue (h)',
    description: 'Expands the state that looks closest to the goal using heuristic h(n).',
    strategy: 'Priority Queue ordered strictly by lowest heuristic distance h(n).',
  },
};

export function executeAlgorithm(
  algorithmId: AlgorithmId,
  config: JugConfiguration
): SearchResult {
  const { capacities, initialState, goal, operationCosts } = config;

  switch (algorithmId) {
    case 'BFS':
      return runBFS(capacities, initialState, goal, operationCosts);
    case 'DFS':
      return runDFS(capacities, initialState, goal, operationCosts);
    case 'ASTAR':
      return runAStar(capacities, initialState, goal, operationCosts);
    case 'UCS':
      return runUCS(capacities, initialState, goal, operationCosts);
    case 'GREEDY':
      return runGreedy(capacities, initialState, goal, operationCosts);
    default:
      return runBFS(capacities, initialState, goal, operationCosts);
  }
}

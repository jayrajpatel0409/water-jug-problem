/**
 * AquaMind AI - Core Type Definitions
 * Focused on Classical AI Search & State-Space Representation
 */

export type JugState = number[];

export type ActionType = 'FILL' | 'EMPTY' | 'POUR';

export interface JugAction {
  type: ActionType;
  jugIndex?: number;
  fromJug?: number;
  toJug?: number;
  amountTransferred?: number;
  cost: number;
  label: string;
  description: string;
}

export type GoalType = 'ANY_JUG' | 'SELECTED_JUG' | 'EXACT_STATE';

export interface GoalConfig {
  type: GoalType;
  targetAmount: number;
  selectedJugIndex: number;
  exactState: JugState;
  description: string;
}

export interface JugConfiguration {
  numJugs: 2 | 3;
  capacities: number[];
  initialState: JugState;
  goal: GoalConfig;
  operationCosts: {
    fill: number;
    empty: number;
    pour: number;
  };
}

export type NodeStatus =
  | 'undiscovered'
  | 'frontier'
  | 'expanded'
  | 'current'
  | 'goal'
  | 'solution'
  | 'cutoff';

export interface SearchNode {
  id: string;
  state: JugState;
  stateKey: string;
  parentId: string | null;
  action: JugAction | null;
  depth: number;
  g: number;
  h: number;
  f: number;
  expandedOrder?: number;
}

export interface VisualSearchNode extends SearchNode {
  status: NodeStatus;
  x?: number;
  y?: number;
  childrenIds: string[];
}

export interface VisualSearchEdge {
  id: string;
  source: string;
  target: string;
  actionLabel: string;
  isSolution: boolean;
}

export type SearchEventType =
  | 'INITIALIZE'
  | 'DEQUEUE'
  | 'GENERATE_SUCCESSOR'
  | 'CYCLE_DETECTED'
  | 'UPDATE_COST'
  | 'GOAL_FOUND'
  | 'SEARCH_EXHAUSTED';

export interface SearchExecutionEvent {
  stepIndex: number;
  type: SearchEventType;
  node: SearchNode;
  activeState: JugState;
  actionTaken: JugAction | null;
  frontierSize: number;
  expandedCount: number;
  frontierStateKeys: string[];
  visitedStateKeys: string[];
  explanation: string;
  isGoal: boolean;
  algorithmSpecifics?: Record<string, string | number | boolean>;
}

export type AlgorithmId = 'BFS' | 'DFS' | 'UCS' | 'ASTAR' | 'GREEDY';

export interface AlgorithmInfo {
  id: AlgorithmId;
  name: string;
  category: 'Uninformed' | 'Informed';
  frontierType: string;
  description: string;
  strategy: string;
}

export interface SearchMetrics {
  generatedStates: number;
  expandedStates: number;
  uniqueDiscoveredStates: number;
  maxFrontierSize: number;
  solutionDepth: number;
  totalPathCost: number;
  executionTimeMs: number;
  maxDepthReached: number;
  approxMemoryBytes?: number;
}

export interface SearchResult {
  algorithm: AlgorithmId;
  found: boolean;
  terminationReason: 'GOAL_FOUND' | 'EXHAUSTED' | 'LIMIT_REACHED';
  solutionPath: SearchNode[];
  solutionActions: JugAction[];
  totalCost: number;
  events: SearchExecutionEvent[];
  treeNodes: VisualSearchNode[];
  treeEdges: VisualSearchEdge[];
  metrics: SearchMetrics;
}

export interface SolvabilityAnalysis {
  isSolvable: boolean;
  reason: string;
  gcdValue?: number;
  reachableStatesCount: number;
  totalPossibleStates: number;
}

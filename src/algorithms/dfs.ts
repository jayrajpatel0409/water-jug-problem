import {
  GoalConfig,
  JugState,
  SearchExecutionEvent,
  SearchNode,
  SearchResult,
} from '../core/types';
import {
  encodeState,
  formatState,
  getValidTransitions,
  OperationCostConfig,
  DEFAULT_OPERATION_COSTS,
} from '../core/stateTransitions';
import { isGoalReached } from '../core/goalTests';
import { buildVisualGraph, createEvent, reconstructPath } from './common';

export function runDFS(
  capacities: number[],
  initialState: JugState,
  goal: GoalConfig,
  costs: OperationCostConfig = DEFAULT_OPERATION_COSTS,
  maxSteps: number = 3000
): SearchResult {
  const startTime = performance.now();
  let stepCounter = 0;
  let expandedCounter = 0;
  let idCounter = 1;

  const events: SearchExecutionEvent[] = [];
  const allNodesMap = new Map<string, SearchNode>();
  const allNodesList: SearchNode[] = [];

  const initialKey = encodeState(initialState);
  const rootNode: SearchNode = {
    id: `node-${idCounter++}`,
    state: [...initialState],
    stateKey: initialKey,
    parentId: null,
    action: null,
    depth: 0,
    g: 0,
    h: 0,
    f: 0,
  };

  allNodesMap.set(rootNode.id, rootNode);
  allNodesList.push(rootNode);

  // DFS Stack (LIFO)
  const stack: SearchNode[] = [rootNode];
  const visited = new Set<string>();

  let maxFrontierSize = 1;
  let maxDepthReached = 0;
  let goalNode: SearchNode | null = null;

  events.push(
    createEvent({
      stepIndex: stepCounter++,
      type: 'INITIALIZE',
      node: rootNode,
      frontierSize: stack.length,
      expandedCount: expandedCounter,
      frontierStateKeys: [initialKey],
      visitedStateKeys: [],
      explanation: `DFS initialized with root state ${formatState(initialState)}. Pushed onto LIFO stack.`,
      isGoal: isGoalReached(initialState, goal),
      algorithmSpecifics: { strategy: 'LIFO Stack', stackDepth: 1 },
    })
  );

  while (stack.length > 0 && !goalNode && stepCounter < maxSteps) {
    maxFrontierSize = Math.max(maxFrontierSize, stack.length);
    const current = stack.pop()!;

    if (visited.has(current.stateKey)) {
      continue;
    }
    visited.add(current.stateKey);
    current.expandedOrder = ++expandedCounter;
    maxDepthReached = Math.max(maxDepthReached, current.depth);

    const goalHit = isGoalReached(current.state, goal);

    events.push(
      createEvent({
        stepIndex: stepCounter++,
        type: goalHit ? 'GOAL_FOUND' : 'DEQUEUE',
        node: current,
        frontierSize: stack.length,
        expandedCount: expandedCounter,
        frontierStateKeys: stack.map((n) => n.stateKey),
        visitedStateKeys: Array.from(visited),
        explanation: goalHit
          ? `DFS popped state ${formatState(current.state)} from stack. Goal reached at depth ${current.depth}!`
          : `DFS popped state ${formatState(current.state)} (depth ${current.depth}) from top of LIFO stack to explore deeper.`,
        isGoal: goalHit,
        algorithmSpecifics: { stackDepth: stack.length, depth: current.depth },
      })
    );

    if (goalHit) {
      goalNode = current;
      break;
    }

    // Successor generation
    const transitions = getValidTransitions(current.state, capacities, costs);

    // To explore transitions in natural order, push in reverse so first transition is popped first
    for (let i = transitions.length - 1; i >= 0; i--) {
      const { action, nextState } = transitions[i];
      const nextKey = encodeState(nextState);

      if (!visited.has(nextKey)) {
        const childNode: SearchNode = {
          id: `node-${idCounter++}`,
          state: nextState,
          stateKey: nextKey,
          parentId: current.id,
          action,
          depth: current.depth + 1,
          g: current.g + action.cost,
          h: 0,
          f: current.g + action.cost,
        };

        allNodesMap.set(childNode.id, childNode);
        allNodesList.push(childNode);
        stack.push(childNode);
        maxDepthReached = Math.max(maxDepthReached, childNode.depth);

        events.push(
          createEvent({
            stepIndex: stepCounter++,
            type: 'GENERATE_SUCCESSOR',
            node: childNode,
            frontierSize: stack.length,
            expandedCount: expandedCounter,
            frontierStateKeys: stack.map((n) => n.stateKey),
            visitedStateKeys: Array.from(visited),
            explanation: `Pushed successor ${formatState(nextState)} via "${action.label}" to stack at depth ${childNode.depth}.`,
            isGoal: false,
          })
        );
      } else {
        events.push(
          createEvent({
            stepIndex: stepCounter++,
            type: 'CYCLE_DETECTED',
            node: current,
            frontierSize: stack.length,
            expandedCount: expandedCounter,
            frontierStateKeys: stack.map((n) => n.stateKey),
            visitedStateKeys: Array.from(visited),
            explanation: `Action "${action.label}" leads to ${formatState(nextState)} which was already visited. Pruned to prevent cycles.`,
            isGoal: false,
          })
        );
      }
    }
  }

  const endTime = performance.now();
  const found = goalNode !== null;
  const { path: solutionPath, actions: solutionActions } = found
    ? reconstructPath(goalNode!, allNodesMap)
    : { path: [], actions: [] };

  const solutionNodeIds = new Set(solutionPath.map((n) => n.id));
  const { visualNodes, visualEdges } = buildVisualGraph(
    allNodesList,
    solutionNodeIds,
    goalNode ? goalNode.id : undefined
  );

  return {
    algorithm: 'DFS',
    found,
    terminationReason: found
      ? 'GOAL_FOUND'
      : stack.length === 0
      ? 'EXHAUSTED'
      : 'LIMIT_REACHED',
    solutionPath,
    solutionActions,
    totalCost: solutionPath.length > 0 ? solutionPath[solutionPath.length - 1].g : 0,
    events,
    treeNodes: visualNodes,
    treeEdges: visualEdges,
    metrics: {
      generatedStates: allNodesList.length,
      expandedStates: expandedCounter,
      uniqueDiscoveredStates: visited.size,
      maxFrontierSize,
      solutionDepth: solutionPath.length > 0 ? solutionPath.length - 1 : 0,
      totalPathCost:
        solutionPath.length > 0 ? solutionPath[solutionPath.length - 1].g : 0,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      maxDepthReached,
      approxMemoryBytes: allNodesList.length * 128,
    },
  };
}

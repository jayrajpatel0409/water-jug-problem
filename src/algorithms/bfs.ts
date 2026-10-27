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

export function runBFS(
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

  // BFS Queue (FIFO)
  const queue: SearchNode[] = [rootNode];
  const visited = new Set<string>();
  visited.add(initialKey);

  let maxFrontierSize = 1;
  let maxDepthReached = 0;
  let goalNode: SearchNode | null = null;

  // Initial event
  events.push(
    createEvent({
      stepIndex: stepCounter++,
      type: 'INITIALIZE',
      node: rootNode,
      frontierSize: queue.length,
      expandedCount: expandedCounter,
      frontierStateKeys: [initialKey],
      visitedStateKeys: [initialKey],
      explanation: `BFS initialized with root state ${formatState(initialState)}. Added to FIFO queue.`,
      isGoal: isGoalReached(initialState, goal),
      algorithmSpecifics: { strategy: 'FIFO Queue', currentLevel: 0 },
    })
  );

  // Early check on initial state
  if (isGoalReached(initialState, goal)) {
    goalNode = rootNode;
    events.push(
      createEvent({
        stepIndex: stepCounter++,
        type: 'GOAL_FOUND',
        node: rootNode,
        frontierSize: queue.length,
        expandedCount: expandedCounter,
        frontierStateKeys: queue.map((n) => n.stateKey),
        visitedStateKeys: Array.from(visited),
        explanation: `Goal reached immediately at root state ${formatState(initialState)}!`,
        isGoal: true,
      })
    );
  }

  while (queue.length > 0 && !goalNode && stepCounter < maxSteps) {
    maxFrontierSize = Math.max(maxFrontierSize, queue.length);
    const current = queue.shift()!;
    current.expandedOrder = ++expandedCounter;
    maxDepthReached = Math.max(maxDepthReached, current.depth);

    events.push(
      createEvent({
        stepIndex: stepCounter++,
        type: 'DEQUEUE',
        node: current,
        frontierSize: queue.length,
        expandedCount: expandedCounter,
        frontierStateKeys: queue.map((n) => n.stateKey),
        visitedStateKeys: Array.from(visited),
        explanation: `BFS dequeued state ${formatState(current.state)} (depth ${current.depth}) from front of FIFO queue to expand its successors.`,
        isGoal: false,
        algorithmSpecifics: { queueLength: queue.length, depth: current.depth },
      })
    );

    const transitions = getValidTransitions(current.state, capacities, costs);

    for (const { action, nextState } of transitions) {
      const nextKey = encodeState(nextState);
      const isAlreadyVisited = visited.has(nextKey);

      if (!isAlreadyVisited) {
        visited.add(nextKey);

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
        queue.push(childNode);
        maxDepthReached = Math.max(maxDepthReached, childNode.depth);

        const goalHit = isGoalReached(nextState, goal);

        events.push(
          createEvent({
            stepIndex: stepCounter++,
            type: goalHit ? 'GOAL_FOUND' : 'GENERATE_SUCCESSOR',
            node: childNode,
            frontierSize: queue.length,
            expandedCount: expandedCounter,
            frontierStateKeys: queue.map((n) => n.stateKey),
            visitedStateKeys: Array.from(visited),
            explanation: goalHit
              ? `Successor ${formatState(nextState)} reached via "${action.label}" satisfies the goal! Goal test passed.`
              : `Generated new successor ${formatState(nextState)} via "${action.label}" at depth ${childNode.depth}. Added to FIFO queue.`,
            isGoal: goalHit,
            algorithmSpecifics: { actionCost: action.cost, depth: childNode.depth },
          })
        );

        if (goalHit) {
          goalNode = childNode;
          break;
        }
      } else {
        // Repeated state skipped
        events.push(
          createEvent({
            stepIndex: stepCounter++,
            type: 'CYCLE_DETECTED',
            node: current,
            frontierSize: queue.length,
            expandedCount: expandedCounter,
            frontierStateKeys: queue.map((n) => n.stateKey),
            visitedStateKeys: Array.from(visited),
            explanation: `Action "${action.label}" produces ${formatState(nextState)}, which has already been visited. Pruned to avoid cycles.`,
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
    algorithm: 'BFS',
    found,
    terminationReason: found
      ? 'GOAL_FOUND'
      : queue.length === 0
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

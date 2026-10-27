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
import { calculateHeuristic, isGoalReached } from '../core/goalTests';
import { buildVisualGraph, createEvent, reconstructPath } from './common';

export function runGreedy(
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
  const initialH = calculateHeuristic(initialState, goal, capacities);

  const rootNode: SearchNode = {
    id: `node-${idCounter++}`,
    state: [...initialState],
    stateKey: initialKey,
    parentId: null,
    action: null,
    depth: 0,
    g: 0,
    h: initialH,
    f: initialH, // Greedy uses f = h
  };

  allNodesMap.set(rootNode.id, rootNode);
  allNodesList.push(rootNode);

  let priorityQueue: SearchNode[] = [rootNode];
  const closedSet = new Set<string>();

  let maxFrontierSize = 1;
  let maxDepthReached = 0;
  let goalNode: SearchNode | null = null;

  events.push(
    createEvent({
      stepIndex: stepCounter++,
      type: 'INITIALIZE',
      node: rootNode,
      frontierSize: priorityQueue.length,
      expandedCount: expandedCounter,
      frontierStateKeys: [initialKey],
      visitedStateKeys: [],
      explanation: `Greedy Best-First Search initialized with root state ${formatState(initialState)}, heuristic h = ${initialH}.`,
      isGoal: isGoalReached(initialState, goal),
      algorithmSpecifics: { h: initialH, priorityQueueSize: 1 },
    })
  );

  while (priorityQueue.length > 0 && !goalNode && stepCounter < maxSteps) {
    maxFrontierSize = Math.max(maxFrontierSize, priorityQueue.length);

    // Sort ascending by heuristic h(n)
    priorityQueue.sort((a, b) => a.h - b.h);
    const current = priorityQueue.shift()!;

    if (closedSet.has(current.stateKey)) {
      continue;
    }
    closedSet.add(current.stateKey);
    current.expandedOrder = ++expandedCounter;
    maxDepthReached = Math.max(maxDepthReached, current.depth);

    const goalHit = isGoalReached(current.state, goal);

    events.push(
      createEvent({
        stepIndex: stepCounter++,
        type: goalHit ? 'GOAL_FOUND' : 'DEQUEUE',
        node: current,
        frontierSize: priorityQueue.length,
        expandedCount: expandedCounter,
        frontierStateKeys: priorityQueue.map((n) => n.stateKey),
        visitedStateKeys: Array.from(closedSet),
        explanation: goalHit
          ? `Greedy search dequeued goal state ${formatState(current.state)} with h = 0! Reached in ${current.depth} moves.`
          : `Greedy search dequeued state ${formatState(current.state)} with lowest heuristic h = ${current.h} (depth ${current.depth}).`,
        isGoal: goalHit,
        algorithmSpecifics: { h: current.h, depth: current.depth },
      })
    );

    if (goalHit) {
      goalNode = current;
      break;
    }

    const transitions = getValidTransitions(current.state, capacities, costs);

    for (const { action, nextState } of transitions) {
      const nextKey = encodeState(nextState);

      if (!closedSet.has(nextKey)) {
        const hVal = calculateHeuristic(nextState, goal, capacities);
        const childNode: SearchNode = {
          id: `node-${idCounter++}`,
          state: nextState,
          stateKey: nextKey,
          parentId: current.id,
          action,
          depth: current.depth + 1,
          g: current.g + action.cost,
          h: hVal,
          f: hVal,
        };

        allNodesMap.set(childNode.id, childNode);
        allNodesList.push(childNode);
        priorityQueue.push(childNode);
        maxDepthReached = Math.max(maxDepthReached, childNode.depth);

        events.push(
          createEvent({
            stepIndex: stepCounter++,
            type: 'GENERATE_SUCCESSOR',
            node: childNode,
            frontierSize: priorityQueue.length,
            expandedCount: expandedCounter,
            frontierStateKeys: priorityQueue.map((n) => n.stateKey),
            visitedStateKeys: Array.from(closedSet),
            explanation: `Generated successor ${formatState(nextState)} via "${action.label}" with heuristic estimate h = ${hVal}.`,
            isGoal: false,
            algorithmSpecifics: { h: hVal, actionCost: action.cost },
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
    algorithm: 'GREEDY',
    found,
    terminationReason: found
      ? 'GOAL_FOUND'
      : priorityQueue.length === 0
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
      uniqueDiscoveredStates: closedSet.size + priorityQueue.length,
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

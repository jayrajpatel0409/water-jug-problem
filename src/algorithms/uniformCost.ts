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

export function runUCS(
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

  // Priority queue: sorted ascending by g(n)
  let priorityQueue: SearchNode[] = [rootNode];

  // Best known cost to reach each state
  const costSoFar = new Map<string, number>();
  costSoFar.set(initialKey, 0);

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
      explanation: `Uniform-Cost Search (UCS) initialized with root state ${formatState(initialState)}, path cost g=0. Added to Min-Priority Queue.`,
      isGoal: isGoalReached(initialState, goal),
      algorithmSpecifics: { g: 0, priorityQueueSize: 1 },
    })
  );

  while (priorityQueue.length > 0 && !goalNode && stepCounter < maxSteps) {
    maxFrontierSize = Math.max(maxFrontierSize, priorityQueue.length);

    // Dequeue node with minimum cumulative cost g(n)
    priorityQueue.sort((a, b) => a.g - b.g);
    const current = priorityQueue.shift()!;

    // In UCS, states are added to closedSet when dequeued
    if (closedSet.has(current.stateKey)) {
      continue;
    }
    closedSet.add(current.stateKey);
    current.expandedOrder = ++expandedCounter;
    maxDepthReached = Math.max(maxDepthReached, current.depth);

    // Goal test on dequeue ensures optimal cost
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
          ? `UCS dequeued goal state ${formatState(current.state)} with optimal path cost g = ${current.g}! Reached in ${current.depth} moves.`
          : `UCS dequeued state ${formatState(current.state)} with lowest path cost g = ${current.g} (depth ${current.depth}) from Priority Queue.`,
        isGoal: goalHit,
        algorithmSpecifics: { g: current.g, depth: current.depth },
      })
    );

    if (goalHit) {
      goalNode = current;
      break;
    }

    const transitions = getValidTransitions(current.state, capacities, costs);

    for (const { action, nextState } of transitions) {
      const nextKey = encodeState(nextState);
      const newCost = current.g + action.cost;

      const previousBestCost = costSoFar.get(nextKey);
      const isCheaper = previousBestCost === undefined || newCost < previousBestCost;

      if (isCheaper) {
        costSoFar.set(nextKey, newCost);

        const childNode: SearchNode = {
          id: `node-${idCounter++}`,
          state: nextState,
          stateKey: nextKey,
          parentId: current.id,
          action,
          depth: current.depth + 1,
          g: newCost,
          h: 0,
          f: newCost,
        };

        allNodesMap.set(childNode.id, childNode);
        allNodesList.push(childNode);
        priorityQueue.push(childNode);
        maxDepthReached = Math.max(maxDepthReached, childNode.depth);

        events.push(
          createEvent({
            stepIndex: stepCounter++,
            type: previousBestCost !== undefined ? 'UPDATE_COST' : 'GENERATE_SUCCESSOR',
            node: childNode,
            frontierSize: priorityQueue.length,
            expandedCount: expandedCounter,
            frontierStateKeys: priorityQueue.map((n) => n.stateKey),
            visitedStateKeys: Array.from(closedSet),
            explanation:
              previousBestCost !== undefined
                ? `Found strictly cheaper path to ${formatState(nextState)}! Cost updated from ${previousBestCost} to ${newCost} via "${action.label}".`
                : `Generated successor ${formatState(nextState)} via "${action.label}" with path cost g = ${newCost}. Added to Priority Queue.`,
            isGoal: false,
            algorithmSpecifics: { g: newCost, actionCost: action.cost },
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
    algorithm: 'UCS',
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
      uniqueDiscoveredStates: costSoFar.size,
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

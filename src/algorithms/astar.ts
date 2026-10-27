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

export function runAStar(
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
    f: 0 + initialH,
  };

  allNodesMap.set(rootNode.id, rootNode);
  allNodesList.push(rootNode);

  let openSet: SearchNode[] = [rootNode];
  const closedSet = new Set<string>();
  const gScore = new Map<string, number>();
  gScore.set(initialKey, 0);

  let maxFrontierSize = 1;
  let maxDepthReached = 0;
  let goalNode: SearchNode | null = null;

  events.push(
    createEvent({
      stepIndex: stepCounter++,
      type: 'INITIALIZE',
      node: rootNode,
      frontierSize: openSet.length,
      expandedCount: expandedCounter,
      frontierStateKeys: [initialKey],
      visitedStateKeys: [],
      explanation: `A* Search initialized with root state ${formatState(initialState)}. Scores: g=0, h=${initialH}, f=${initialH}. Added to Open Set.`,
      isGoal: isGoalReached(initialState, goal),
      algorithmSpecifics: { g: 0, h: initialH, f: initialH, openSetSize: 1 },
    })
  );

  while (openSet.length > 0 && !goalNode && stepCounter < maxSteps) {
    maxFrontierSize = Math.max(maxFrontierSize, openSet.length);

    // Sort ascending by f(n), breaking ties with h(n)
    openSet.sort((a, b) => (a.f === b.f ? a.h - b.h : a.f - b.f));
    const current = openSet.shift()!;

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
        frontierSize: openSet.length,
        expandedCount: expandedCounter,
        frontierStateKeys: openSet.map((n) => n.stateKey),
        visitedStateKeys: Array.from(closedSet),
        explanation: goalHit
          ? `A* dequeued goal state ${formatState(current.state)} with optimal f = ${current.f} (g=${current.g}, h=0)!`
          : `A* dequeued state ${formatState(current.state)} with lowest f = ${current.f} (g=${current.g}, h=${current.h}) from Open Set.`,
        isGoal: goalHit,
        algorithmSpecifics: { g: current.g, h: current.h, f: current.f, depth: current.depth },
      })
    );

    if (goalHit) {
      goalNode = current;
      break;
    }

    const transitions = getValidTransitions(current.state, capacities, costs);

    for (const { action, nextState } of transitions) {
      const nextKey = encodeState(nextState);
      const tentativeG = current.g + action.cost;

      const currentBestG = gScore.get(nextKey);
      const isBetterPath = currentBestG === undefined || tentativeG < currentBestG;

      if (isBetterPath) {
        gScore.set(nextKey, tentativeG);
        const hVal = calculateHeuristic(nextState, goal, capacities);
        const fVal = tentativeG + hVal;

        const childNode: SearchNode = {
          id: `node-${idCounter++}`,
          state: nextState,
          stateKey: nextKey,
          parentId: current.id,
          action,
          depth: current.depth + 1,
          g: tentativeG,
          h: hVal,
          f: fVal,
        };

        allNodesMap.set(childNode.id, childNode);
        allNodesList.push(childNode);
        openSet.push(childNode);
        maxDepthReached = Math.max(maxDepthReached, childNode.depth);

        events.push(
          createEvent({
            stepIndex: stepCounter++,
            type: currentBestG !== undefined ? 'UPDATE_COST' : 'GENERATE_SUCCESSOR',
            node: childNode,
            frontierSize: openSet.length,
            expandedCount: expandedCounter,
            frontierStateKeys: openSet.map((n) => n.stateKey),
            visitedStateKeys: Array.from(closedSet),
            explanation:
              currentBestG !== undefined
                ? `Cheaper path found to ${formatState(nextState)}! Updated g: ${currentBestG} → ${tentativeG}, new f = ${fVal}.`
                : `Generated successor ${formatState(nextState)} via "${action.label}". Scores: g=${tentativeG}, h=${hVal}, f=${fVal}.`,
            isGoal: false,
            algorithmSpecifics: { g: tentativeG, h: hVal, f: fVal, actionCost: action.cost },
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
    algorithm: 'ASTAR',
    found,
    terminationReason: found
      ? 'GOAL_FOUND'
      : openSet.length === 0
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
      uniqueDiscoveredStates: gScore.size,
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

import {
  JugAction,
  JugState,
  SearchExecutionEvent,
  SearchNode,
  VisualSearchEdge,
  VisualSearchNode,
} from '../core/types';
import { formatState } from '../core/stateTransitions';

export function reconstructPath(
  goalNode: SearchNode,
  nodeMap: Map<string, SearchNode>
): { path: SearchNode[]; actions: JugAction[] } {
  const path: SearchNode[] = [];
  const actions: JugAction[] = [];

  let current: SearchNode | null = goalNode;
  while (current !== null) {
    path.unshift(current);
    if (current.action) {
      actions.unshift(current.action);
    }
    current = current.parentId ? nodeMap.get(current.parentId) || null : null;
  }

  return { path, actions };
}

export function buildVisualGraph(
  allNodes: SearchNode[],
  solutionNodeIds: Set<string>,
  activeNodeId?: string
): { visualNodes: VisualSearchNode[]; visualEdges: VisualSearchEdge[] } {
  const childrenMap = new Map<string, string[]>();
  const nodeMap = new Map<string, SearchNode>();

  allNodes.forEach((node) => {
    nodeMap.set(node.id, node);
    if (node.parentId) {
      const list = childrenMap.get(node.parentId) || [];
      list.push(node.id);
      childrenMap.set(node.parentId, list);
    }
  });

  const visualNodes: VisualSearchNode[] = allNodes.map((node) => {
    let status: VisualSearchNode['status'] = 'undiscovered';
    if (solutionNodeIds.has(node.id)) {
      status = 'solution';
    } else if (node.id === activeNodeId) {
      status = 'current';
    } else if (node.expandedOrder !== undefined) {
      status = 'expanded';
    } else {
      status = 'frontier';
    }

    return {
      ...node,
      status,
      childrenIds: childrenMap.get(node.id) || [],
    };
  });

  const visualEdges: VisualSearchEdge[] = [];
  allNodes.forEach((node) => {
    if (node.parentId && node.action) {
      const isSolution =
        solutionNodeIds.has(node.id) && solutionNodeIds.has(node.parentId);
      visualEdges.push({
        id: `e-${node.parentId}-${node.id}`,
        source: node.parentId,
        target: node.id,
        actionLabel: node.action.label,
        isSolution,
      });
    }
  });

  return { visualNodes, visualEdges };
}

export function createEvent(params: {
  stepIndex: number;
  type: SearchExecutionEvent['type'];
  node: SearchNode;
  frontierSize: number;
  expandedCount: number;
  frontierStateKeys: string[];
  visitedStateKeys: string[];
  explanation: string;
  isGoal: boolean;
  algorithmSpecifics?: Record<string, string | number | boolean>;
}): SearchExecutionEvent {
  return {
    stepIndex: params.stepIndex,
    type: params.type,
    node: params.node,
    activeState: params.node.state,
    actionTaken: params.node.action,
    frontierSize: params.frontierSize,
    expandedCount: params.expandedCount,
    frontierStateKeys: params.frontierStateKeys,
    visitedStateKeys: params.visitedStateKeys,
    explanation: params.explanation,
    isGoal: params.isGoal,
    algorithmSpecifics: params.algorithmSpecifics,
  };
}

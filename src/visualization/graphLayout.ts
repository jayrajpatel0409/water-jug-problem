import { VisualSearchEdge, VisualSearchNode } from '../core/types';

export interface LayoutedGraph {
  nodes: VisualSearchNode[];
  edges: VisualSearchEdge[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  truncated: boolean;
}

/**
 * Computes hierarchical tree coordinates for Search Tree mode
 * Uses tidy tree layout where children branch under parents
 */
export function computeTreeLayout(
  nodes: VisualSearchNode[],
  edges: VisualSearchEdge[],
  maxVisibleNodes: number = 100
): LayoutedGraph {
  if (nodes.length === 0) {
    return {
      nodes: [],
      edges: [],
      bounds: { minX: 0, maxX: 600, minY: 0, maxY: 400 },
      truncated: false,
    };
  }

  const truncated = nodes.length > maxVisibleNodes;
  const visibleNodes = nodes.slice(0, maxVisibleNodes);
  const nodeMap = new Map<string, VisualSearchNode>();
  visibleNodes.forEach((n) => nodeMap.set(n.id, { ...n }));

  const visibleNodeIds = new Set(nodeMap.keys());
  const visibleEdges = edges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  // Build adjacency: parent -> children
  const childrenMap = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  visibleNodes.forEach((n) => {
    childrenMap.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  visibleEdges.forEach((e) => {
    childrenMap.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  // Find roots (in-degree === 0 or parentId === null)
  let roots = visibleNodes.filter(
    (n) => (inDegree.get(n.id) || 0) === 0 || !n.parentId
  );
  if (roots.length === 0 && visibleNodes.length > 0) {
    roots = [visibleNodes[0]];
  }

  const levelHeight = 110;
  const nodeWidth = 110;
  const minSiblingGap = 30;

  // Post-order traversal to calculate subtree width
  const subtreeWidths = new Map<string, number>();
  const visited = new Set<string>();

  function calcSubtreeWidth(nodeId: string): number {
    if (visited.has(nodeId)) return subtreeWidths.get(nodeId) || (nodeWidth + minSiblingGap);
    visited.add(nodeId);

    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) {
      const w = nodeWidth + minSiblingGap;
      subtreeWidths.set(nodeId, w);
      return w;
    }

    let totalWidth = 0;
    children.forEach((childId) => {
      totalWidth += calcSubtreeWidth(childId);
    });

    const w = Math.max(nodeWidth + minSiblingGap, totalWidth);
    subtreeWidths.set(nodeId, w);
    return w;
  }

  roots.forEach((r) => calcSubtreeWidth(r.id));

  // Assign X and Y coordinates recursively
  const placed = new Set<string>();
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = 0;

  function assignPositions(nodeId: string, leftX: number, depth: number) {
    if (placed.has(nodeId)) return;
    placed.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return;

    const width = subtreeWidths.get(nodeId) || (nodeWidth + minSiblingGap);
    const children = childrenMap.get(nodeId) || [];

    node.y = depth * levelHeight + 50;
    maxY = Math.max(maxY, node.y + 40);

    if (children.length === 0) {
      node.x = leftX + width / 2;
    } else {
      let currentLeft = leftX;
      children.forEach((childId) => {
        const childWidth = subtreeWidths.get(childId) || (nodeWidth + minSiblingGap);
        assignPositions(childId, currentLeft, depth + 1);
        currentLeft += childWidth;
      });

      // Center parent over its first and last child
      const firstChild = nodeMap.get(children[0]);
      const lastChild = nodeMap.get(children[children.length - 1]);
      if (firstChild?.x !== undefined && lastChild?.x !== undefined) {
        node.x = (firstChild.x + lastChild.x) / 2;
      } else {
        node.x = leftX + width / 2;
      }
    }

    minX = Math.min(minX, node.x - 50);
    maxX = Math.max(maxX, node.x + 50);
  }

  let rootLeft = 50;
  roots.forEach((r) => {
    const w = subtreeWidths.get(r.id) || (nodeWidth + minSiblingGap);
    assignPositions(r.id, rootLeft, 0);
    rootLeft += w + 40;
  });

  // Any unplaced nodes placed in a fallback row
  visibleNodes.forEach((n, idx) => {
    const node = nodeMap.get(n.id);
    if (node && (node.x === undefined || node.y === undefined)) {
      node.x = 100 + idx * (nodeWidth + 20);
      node.y = (n.depth || 0) * levelHeight + 50;
      minX = Math.min(minX, node.x - 50);
      maxX = Math.max(maxX, node.x + 50);
      maxY = Math.max(maxY, node.y + 40);
    }
  });

  if (minX === Infinity) {
    minX = 0;
    maxX = 600;
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: visibleEdges,
    bounds: { minX, maxX, minY: 0, maxY: maxY + 60 },
    truncated,
  };
}

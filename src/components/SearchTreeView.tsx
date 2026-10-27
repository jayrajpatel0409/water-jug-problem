import React, { useState, useMemo } from 'react';
import { GitBranch } from 'lucide-react';
import { JugAction, JugState, SearchNode, VisualSearchEdge, VisualSearchNode } from '../core/types';
import { computeTreeLayout } from '../visualization/graphLayout';
import { formatState } from '../core/stateTransitions';

interface SearchTreeViewProps {
  nodes: VisualSearchNode[];
  edges: VisualSearchEdge[];
  activeNodeId?: string;
  activeState: JugState;
  activeAction: JugAction | null;
  currentStepIndex: number;
  solutionNodeIds: Set<string>;
  solutionPath: SearchNode[];
  onSelectNode: (state: JugState, action: JugAction | null, index?: number) => void;
}

export const SearchTreeView: React.FC<SearchTreeViewProps> = ({
  nodes,
  edges,
  activeNodeId,
  activeState,
  solutionNodeIds,
  solutionPath,
  onSelectNode,
}) => {
  // Toggle: Solution only vs Everything (fixed, non-movable tree)
  const [viewMode, setViewMode] = useState<'SOLUTION' | 'EVERYTHING'>('EVERYTHING');

  // Filter nodes based on viewMode
  const { displayNodes, displayEdges } = useMemo(() => {
    if (viewMode === 'SOLUTION') {
      const pathIds = new Set(solutionPath.map((n) => n.id));
      const solNodes = nodes.filter((n) => pathIds.has(n.id));
      const solEdges = edges.filter(
        (e) => pathIds.has(e.source) && pathIds.has(e.target)
      );
      return { displayNodes: solNodes, displayEdges: solEdges };
    }
    return { displayNodes: nodes, displayEdges: edges };
  }, [nodes, edges, viewMode, solutionPath]);

  // Compute fixed tree layout
  const layout = useMemo(() => {
    return computeTreeLayout(displayNodes, displayEdges, 100);
  }, [displayNodes, displayEdges]);

  // Calculate static viewBox for fixed non-movable tree display
  const viewBox = useMemo(() => {
    const { minX, maxX, minY, maxY } = layout.bounds;
    const paddingX = 45;
    const paddingY = 35;
    const width = Math.max(480, maxX - minX + paddingX * 2);
    const height = Math.max(460, maxY - minY + paddingY * 2);
    const x = minX - paddingX;
    const y = minY - 10;
    return `${x} ${y} ${width} ${height}`;
  }, [layout.bounds]);

  const activeStateStr = formatState(activeState);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 flex flex-col h-full min-h-[580px] select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        {/* Left: Title, State badge & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#ec4899] text-white flex items-center justify-center shrink-0 shadow-sm">
            <GitBranch className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                Search tree
              </h2>
              <span className="bg-sky-100 text-sky-700 font-bold px-2.5 py-0.5 rounded-full text-xs font-mono">
                {layout.nodes.length} states
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Tap any bubble to see it in the jugs.
            </p>
          </div>
        </div>

        {/* Right: View Toggle (Solution only vs Everything) */}
        <div className="flex items-center space-x-3">
          <div className="bg-sky-100/60 p-1 rounded-full border border-sky-200/50 flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode('SOLUTION')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                viewMode === 'SOLUTION'
                  ? 'bg-[#0088ff] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Solution only
            </button>
            <button
              onClick={() => setViewMode('EVERYTHING')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                viewMode === 'EVERYTHING'
                  ? 'bg-[#0088ff] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Everything
            </button>
          </div>
        </div>
      </div>

      {/* Fixed-Size Non-Movable Tree Canvas */}
      <div className="flex-1 min-h-[440px] relative overflow-hidden bg-transparent flex items-center justify-center">
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-h-[500px]"
        >
          {/* Draw Connecting Curved Lines */}
          {layout.edges.map((edge) => {
            const src = layout.nodes.find((n) => n.id === edge.source);
            const tgt = layout.nodes.find((n) => n.id === edge.target);
            if (!src || !tgt || src.x === undefined || tgt.x === undefined)
              return null;

            const x1 = src.x;
            const y1 = src.y! + 18;
            const x2 = tgt.x;
            const y2 = tgt.y! - 18;
            const midY = (y1 + y2) / 2;
            const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

            const isSolutionEdge = edge.isSolution;

            return (
              <g key={edge.id}>
                {/* Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSolutionEdge ? '#f97316' : '#cbd5e1'}
                  strokeWidth={isSolutionEdge ? 3.5 : 1.5}
                  strokeLinecap="round"
                />

                {/* Action label near the middle */}
                <text
                  x={(x1 + x2) / 2 + (x2 < x1 ? -8 : 8)}
                  y={midY}
                  textAnchor={x2 < x1 ? 'end' : 'start'}
                  fill={isSolutionEdge ? '#ea580c' : '#94a3b8'}
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="sans-serif"
                  className="select-none pointer-events-none"
                >
                  {edge.actionLabel
                    .replace(/Jug\s+/gi, '')
                    .replace(/into\s+/gi, '→ ')
                    .replace(/->/g, '→')
                    .trim()}
                </text>
              </g>
            );
          })}

          {/* Draw Nodes */}
          {layout.nodes.map((node) => {
            if (node.x === undefined || node.y === undefined) return null;

            const isRoot = !node.parentId;
            const isGoal =
              solutionPath.length > 0 &&
              solutionPath[solutionPath.length - 1].id === node.id;
            const isSolution = solutionNodeIds.has(node.id) && !isGoal;
            const isCurrentlyShown =
              node.id === activeNodeId ||
              formatState(node.state) === activeStateStr;

            let pillFill = '#ffffff';
            let pillStroke = '#cbd5e1';
            let textColor = '#1e293b';

            if (isCurrentlyShown) {
              pillFill = '#e0f2fe';
              pillStroke = '#0088ff';
              textColor = '#0369a1';
            } else if (isGoal) {
              pillFill = '#dcfce7';
              pillStroke = '#10b981';
              textColor = '#15803d';
            } else if (isSolution) {
              pillFill = '#fff7ed';
              pillStroke = '#f97316';
              textColor = '#c2410c';
            } else if (isRoot) {
              pillFill = '#f0f9ff';
              pillStroke = '#0088ff';
              textColor = '#0369a1';
            }

            const width = 84;
            const height = 36;
            const rx = 18;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  const solIndex = solutionPath.findIndex(
                    (n) => n.id === node.id
                  );
                  onSelectNode(
                    node.state,
                    node.action,
                    solIndex >= 0 ? solIndex : undefined
                  );
                }}
                className="cursor-pointer group"
              >
                {/* Outer active highlight ring if currently shown */}
                {isCurrentlyShown && (
                  <rect
                    x={-width / 2 - 4}
                    y={-height / 2 - 4}
                    width={width + 8}
                    height={height + 8}
                    rx={rx + 2}
                    fill="none"
                    stroke="#0088ff"
                    strokeWidth="2"
                    opacity="0.4"
                  />
                )}

                {/* Main Pill */}
                <rect
                  x={-width / 2}
                  y={-height / 2}
                  width={width}
                  height={height}
                  rx={rx}
                  fill={pillFill}
                  stroke={pillStroke}
                  strokeWidth={
                    isCurrentlyShown || isSolution || isGoal || isRoot
                      ? 2.5
                      : 1.5
                  }
                  className="transition-all group-hover:filter group-hover:drop-shadow-sm"
                />

                {/* State Text */}
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill={textColor}
                  fontSize="13"
                  fontWeight="800"
                  fontFamily="monospace"
                  className="select-none pointer-events-none"
                >
                  {formatState(node.state)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-start space-x-6 text-xs font-semibold text-slate-600 flex-wrap gap-y-2">
        <span className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0088ff]" />
          <span>Currently shown</span>
        </span>
        <span className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
          <span>Solution path</span>
        </span>
        <span className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          <span>Goal reached</span>
        </span>
        <span className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1]" />
          <span>Explored, not used</span>
        </span>
      </div>
    </div>
  );
};

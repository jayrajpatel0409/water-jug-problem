import React from 'react';
import { Footprints, Scan, Boxes, Activity, Clock } from 'lucide-react';
import { SearchMetrics } from '../core/types';

interface MetricsPanelProps {
  metrics: SearchMetrics;
  solutionMovesCount: number;
  found: boolean;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  metrics,
  solutionMovesCount,
  found,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* 1. MOVES */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/80 flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-full bg-amber-400 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Footprints className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            MOVES
          </span>
          <span className="text-2xl font-black text-slate-900 leading-none">
            {found ? solutionMovesCount : 0}
          </span>
        </div>
      </div>

      {/* 2. EXPLORED */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/80 flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-full bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-sm">
          <Scan className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            EXPLORED
          </span>
          <span className="text-2xl font-black text-slate-900 leading-none">
            {metrics.expandedStates}
          </span>
        </div>
      </div>

      {/* 3. FOUND */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/80 flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-full bg-[#10b981] text-white flex items-center justify-center shrink-0 shadow-sm">
          <Boxes className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            FOUND
          </span>
          <span className="text-2xl font-black text-slate-900 leading-none">
            {metrics.generatedStates}
          </span>
        </div>
      </div>

      {/* 4. PEAK QUEUE */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/80 flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-full bg-[#ec4899] text-white flex items-center justify-center shrink-0 shadow-sm">
          <Activity className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            PEAK QUEUE
          </span>
          <span className="text-2xl font-black text-slate-900 leading-none">
            {metrics.maxFrontierSize}
          </span>
        </div>
      </div>

      {/* 5. TIME */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/80 flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-full bg-[#0088ff] text-white flex items-center justify-center shrink-0 shadow-sm">
          <Clock className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
            TIME
          </span>
          <span className="text-2xl font-black text-slate-900 leading-none">
            {metrics.executionTimeMs.toFixed(1)} ms
          </span>
        </div>
      </div>
    </div>
  );
};

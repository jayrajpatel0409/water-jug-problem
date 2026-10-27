import React from 'react';
import { X, CheckCircle2, Waves, GitBranch, Sparkles } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#0284c7] text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Waves className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              How AquaMind Works
            </h3>
            <p className="text-xs text-slate-500">
              Classical AI State-Space Search Visualizer
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3.5">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 mb-1 text-sm">
              <Sparkles className="w-4 h-4 text-[#0088ff]" />
              The Water Jug Problem
            </h4>
            <p>
              Given jugs with specific capacities (e.g. 4L and 3L) and no measurement markings,
              measure out an exact target amount of water (e.g. 2L) using only three fundamental actions:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside font-medium text-slate-700">
              <li><b>Fill:</b> Fill any jug to its maximum capacity.</li>
              <li><b>Empty:</b> Completely empty any jug onto the ground.</li>
              <li><b>Pour:</b> Pour water from one jug into another until the source is empty or the destination is full.</li>
            </ul>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 mb-1 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Mathematical Solvability (Bézout's Identity)
            </h4>
            <p>
              A target volume <i>d</i> is measurable if and only if <i>d &le; max(capacities)</i> and <i>d</i> is a multiple of the Greatest Common Divisor (GCD) of the jug capacities:
              <br />
              <code className="mt-1 block font-mono text-[11px] font-bold text-emerald-800 bg-white/80 p-1.5 rounded-lg border border-emerald-200">
                d = a &times; C₁ + b &times; C₂ = k &times; gcd(C₁, C₂)
              </code>
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 mb-1 text-sm">
              <GitBranch className="w-4 h-4 text-amber-600" />
              Synchronized Search Tree
            </h4>
            <p>
              As the algorithm searches, every state tuple <code>(Jug A, Jug B)</code> forms a node in the tree.
              Clicking any bubble in the search tree immediately renders that exact state inside the water jugs!
            </p>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-[#0088ff] text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:bg-blue-600 transition cursor-pointer"
          >
            Got it, let's explore!
          </button>
        </div>
      </div>
    </div>
  );
};

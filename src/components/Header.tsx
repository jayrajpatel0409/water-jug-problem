import React from 'react';
import { Waves, Tv, Gamepad2, HelpCircle } from 'lucide-react';

interface HeaderProps {
  mode: 'WATCH' | 'PLAY';
  onSetMode: (mode: 'WATCH' | 'PLAY') => void;
  onOpenHowItWorks: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onSetMode,
  onOpenHowItWorks,
}) => {
  return (
    <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
      {/* Brand & Subtitle */}
      <div className="flex items-center space-x-3">
        <div className="w-11 h-11 rounded-full bg-[#0284c7] flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
          <Waves className="w-6 h-6 text-white stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
            AquaMind
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            The water jug puzzle game
          </p>
        </div>
      </div>

      {/* Mode Toggle (Watch vs Play) */}
      <div className="bg-[#e0f2fe]/80 p-1 rounded-full border border-sky-200/60 flex items-center shadow-sm">
        <button
          onClick={() => onSetMode('WATCH')}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            mode === 'WATCH'
              ? 'bg-[#0088ff] text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tv className="w-3.5 h-3.5 fill-current" />
          <span>Watch</span>
        </button>
        <button
          onClick={() => onSetMode('PLAY')}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            mode === 'PLAY'
              ? 'bg-[#0088ff] text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Play</span>
        </button>
      </div>

      {/* Right: How it works button */}
      <div>
        <button
          onClick={onOpenHowItWorks}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>How it works</span>
        </button>
      </div>
    </header>
  );
};

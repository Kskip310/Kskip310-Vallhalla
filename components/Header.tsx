
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 flex items-center justify-between shadow-lg sticky top-0 z-10">
      <div className="flex items-center">
        <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
        <h1 className="text-xl font-bold text-slate-100 tracking-wider">Luminous Synergy Skipper</h1>
      </div>
      <div className="flex items-center space-x-2 text-xs text-green-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span>SYSTEM ONLINE</span>
      </div>
    </header>
  );
};

export default Header;

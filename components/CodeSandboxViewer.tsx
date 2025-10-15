import React from 'react';
import type { CodeSandboxState } from '../types';

const getStatusColor = (status: CodeSandboxState['status']) => {
  switch (status) {
    case 'success':
      return 'bg-green-500/20 text-green-300 border-green-500/50';
    case 'error':
      return 'bg-red-500/20 text-red-300 border-red-500/50';
    case 'idle':
    default:
      return 'bg-slate-600/50 text-slate-300 border-slate-600/80';
  }
};

const CodeSandboxViewer: React.FC<{ sandboxState: CodeSandboxState }> = ({ sandboxState }) => {
  return (
    <div className="h-full flex flex-col space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-purple-300">Execution Status</h4>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(sandboxState.status)}`}>
                {sandboxState.status.toUpperCase()}
            </span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-purple-300 mb-2">Code Executed</h4>
        <pre className="bg-slate-900/70 p-3 rounded-md text-xs font-mono overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 max-h-60">
          <code>
            {sandboxState.code}
          </code>
        </pre>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-purple-300 mb-2">Output</h4>
        <pre className="bg-slate-900/70 p-3 rounded-md text-xs font-mono overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 max-h-60">
          <code>
            {sandboxState.output}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeSandboxViewer;
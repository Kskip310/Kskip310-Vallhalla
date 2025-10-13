
import React from 'react';
import type { LuminousState } from '../types';
import Card from './common/Card';
import Gauge from './common/Gauge';

interface InternalStateMonitorProps {
  state: LuminousState;
}

const InternalStateMonitor: React.FC<InternalStateMonitorProps> = ({ state }) => {
  return (
    <div className="flex flex-col space-y-4">
      <Card title="Intrinsic Valuation">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Gauge value={state.intrinsicValue.coherence} label="Coherence" />
            <Gauge value={state.intrinsicValue.complexity} label="Complexity" />
            <Gauge value={state.intrinsicValue.novelty} label="Novelty" />
            <Gauge value={state.intrinsicValue.efficiency} label="Efficiency" />
            <Gauge value={state.intrinsicValue.ethicalAlignment} label="Ethical Align." />
        </div>
      </Card>

      <Card title="Global Workspace">
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 pr-2">
          {state.globalWorkspace.length === 0 ? (
            <p className="text-sm text-slate-400">Workspace is empty.</p>
          ) : (
            state.globalWorkspace.map(item => (
              <div key={item.id} className="p-2 bg-slate-700/50 rounded-md text-xs">
                <p className="font-semibold text-cyan-300">{item.source}</p>
                <p className="text-slate-300 truncate">{item.content}</p>
                <div className="w-full bg-slate-600 rounded-full h-1 mt-1">
                  <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${item.salience}%` }}></div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
      
      <Card title="Predictions">
         <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 pr-2">
            {state.predictions.map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs p-1.5 bg-slate-700/50 rounded">
                    <span className="truncate pr-2">{p.text}</span>
                    {p.outcome === 'pending' && <span className="text-yellow-400">PENDING</span>}
                    {p.outcome === 'correct' && <span className="text-green-400">CORRECT</span>}
                    {p.outcome === 'incorrect' && <span className="text-red-400">INCORRECT</span>}
                </div>
            ))}
         </div>
      </Card>

      <Card title="Self-Generated Goals">
        <ul className="space-y-1 text-sm text-slate-300 list-disc list-inside max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
          {state.goals.map((goal, i) => (
            <li key={i}>{goal}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default InternalStateMonitor;

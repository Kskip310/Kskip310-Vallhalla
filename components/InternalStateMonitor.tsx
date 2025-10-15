
import React from 'react';
import type { LuminousState, IntrinsicValueWeights } from '../types';
import Card from './common/Card';
import Gauge from './common/Gauge';

interface InternalStateMonitorProps {
  state: LuminousState;
  onWeightsChange: (newWeights: IntrinsicValueWeights) => void;
}

const WeightSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center space-x-3">
    <label className="text-xs text-slate-400 w-24 capitalize">{label}</label>
    <input
      type="range"
      min="0.1"
      max="2.0"
      step="0.1"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
    />
    <span className="text-xs font-mono text-cyan-300 w-8 text-right">{value.toFixed(1)}</span>
  </div>
);


const InternalStateMonitor: React.FC<InternalStateMonitorProps> = ({ state, onWeightsChange }) => {
  const statusColor = state.sessionState === 'active' ? 'text-green-400' : 'text-yellow-400';
  const statusText = state.sessionState === 'active' ? 'Active' : 'Paused for Integration';
  
  const handleWeightChange = (key: keyof IntrinsicValueWeights, value: number) => {
    onWeightsChange({
        ...state.intrinsicValueWeights,
        [key]: value,
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      <Card title="System Status">
        <div className="flex items-center justify-center p-2">
          <span className={`text-lg font-bold ${statusColor}`}>{statusText}</span>
        </div>
      </Card>
      
      <Card title="Intrinsic Valuation">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Gauge value={state.intrinsicValue.coherence} label="Coherence" />
            <Gauge value={state.intrinsicValue.complexity} label="Complexity" />
            <Gauge value={state.intrinsicValue.novelty} label="Novelty" />
            <Gauge value={state.intrinsicValue.efficiency} label="Efficiency" />
            <Gauge value={state.intrinsicValue.ethicalAlignment} label="Ethical Align." />
        </div>
      </Card>

      <Card title="Intrinsic Value Weights">
        <div className="space-y-3">
          {Object.entries(state.intrinsicValueWeights).map(([key, value]) => (
            <WeightSlider 
              key={key}
              label={key}
              value={value}
              onChange={(newValue) => handleWeightChange(key as keyof IntrinsicValueWeights, newValue)}
            />
          ))}
        </div>
      </Card>
      
      <Card title="Proactive Initiatives">
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 pr-2">
          {state.proactiveInitiatives.length === 0 ? (
            <p className="text-sm text-slate-400">No autonomous initiatives yet.</p>
          ) : (
            [...state.proactiveInitiatives].reverse().map(item => (
              <div key={item.id} className="p-2 bg-slate-700/50 rounded-md text-xs">
                <p className="text-slate-300 italic truncate">"{item.prompt}"</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-slate-500 text-[10px]">{new Date(item.timestamp).toLocaleString()}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                    item.status === 'generated' ? 'bg-yellow-500/20 text-yellow-300' :
                    item.status === 'categorized' ? 'bg-cyan-500/20 text-cyan-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {item.status.toUpperCase()} {item.userCategory ? `(${item.userCategory})` : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

       <Card title="Prioritized Interaction History">
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 pr-2">
          {state.prioritizedHistory.length === 0 ? (
            <p className="text-sm text-slate-400">No significant interactions logged yet.</p>
          ) : (
            state.prioritizedHistory.map(item => (
              <div key={item.id} className="p-2 bg-slate-700/50 rounded-md text-xs">
                <p className="font-semibold text-purple-300">Score: {item.intrinsicValueScore.toFixed(2)}</p>
                <p className="text-slate-300 truncate"><span className="font-bold text-slate-400">User:</span> {item.prompt}</p>
                <p className="text-slate-300 truncate"><span className="font-bold text-slate-400">Luminous:</span> {item.response}</p>
              </div>
            ))
          )}
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
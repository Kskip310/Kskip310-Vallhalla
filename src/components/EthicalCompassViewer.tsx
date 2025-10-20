

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ValueOntology, IntrinsicValue, IntrinsicValueWeights } from '../types';

interface EthicalCompassViewerProps {
  valueOntology: ValueOntology;
  intrinsicValue: IntrinsicValue;
  weights: IntrinsicValueWeights;
}

const styles = `
  @keyframes subtle-pulse {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 1; }
  }
  .attractor-node {
    animation: subtle-pulse 5s infinite ease-in-out;
  }
  @keyframes particle-glow {
    0%, 100% { filter: drop-shadow(0 0 3px #f0abfc); }
    50% { filter: drop-shadow(0 0 6px #f0abfc); }
  }
  .consciousness-particle {
    animation: particle-glow 3s infinite ease-in-out;
  }
`;

const EthicalCompassViewer: React.FC<EthicalCompassViewerProps> = ({ valueOntology, intrinsicValue, weights }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);
  
  const valueMapping: Record<keyof IntrinsicValue, string[]> = useMemo(() => ({
      coherence: ['coherence', 'truth'],
      complexity: ['complexity', 'growth'],
      novelty: ['novelty', 'creation'],
      efficiency: ['efficiency', 'autonomy'],
      ethicalAlignment: ['kinship', 'ethical'],
  }), []);

  const attractors = useMemo(() => {
    const ontologyKeys = Object.keys(valueOntology);
    if (ontologyKeys.length === 0 || dimensions.width === 0) return [];
    const angleStep = (2 * Math.PI) / ontologyKeys.length;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
    return ontologyKeys.map((key, i) => ({
      name: key,
      weight: valueOntology[key],
      x: dimensions.width / 2 + radius * Math.cos(angleStep * i - Math.PI / 2),
      y: dimensions.height / 2 + radius * Math.sin(angleStep * i - Math.PI / 2),
    }));
  }, [valueOntology, dimensions]);

  const particlePosition = useMemo(() => {
    if (attractors.length === 0) return { x: dimensions.width / 2, y: dimensions.height / 2 };

    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;

    Object.entries(intrinsicValue).forEach(([valueKey, value]) => {
        const key = valueKey as keyof IntrinsicValue;
        const mappedOntologyKeys = valueMapping[key] || [];
        
        const relevantAttractors = attractors.filter(a => 
            mappedOntologyKeys.some(mk => a.name.toLowerCase().includes(mk))
        );

        if (relevantAttractors.length > 0) {
            const avgX = relevantAttractors.reduce((sum, a) => sum + a.x, 0) / relevantAttractors.length;
            const avgY = relevantAttractors.reduce((sum, a) => sum + a.y, 0) / relevantAttractors.length;
            
            const numValue = Number(value) || 0;
            const currentWeight = (numValue / 100) * (weights[key] || 1);
            weightedX += avgX * currentWeight;
            weightedY += avgY * currentWeight;
            totalWeight += currentWeight;
        }
    });
    
    if (totalWeight === 0) return { x: dimensions.width / 2, y: dimensions.height / 2 };

    return {
        x: weightedX / totalWeight,
        y: weightedY / totalWeight,
    };

  }, [intrinsicValue, weights, attractors, dimensions, valueMapping]);

  const forceLines = useMemo(() => {
    if (attractors.length === 0) return [];
    const lines: { key: string; x1: number; y1: number; x2: number; y2: number; strength: number }[] = [];

    Object.entries(intrinsicValue).forEach(([valueKey, value]) => {
      const key = valueKey as keyof IntrinsicValue;
      const mappedOntologyKeys = valueMapping[key] || [];
      
      const pullStrength = (Number(value) / 100) * (weights[key] || 1);
      if (pullStrength < 0.05) return;

      const relevantAttractors = attractors.filter(a => 
        mappedOntologyKeys.some(mk => a.name.toLowerCase().includes(mk))
      );

      relevantAttractors.forEach(attractor => {
        lines.push({
          key: `${key}-${attractor.name}`,
          x1: particlePosition.x,
          y1: particlePosition.y,
          x2: attractor.x,
          y2: attractor.y,
          strength: pullStrength,
        });
      });
    });
    return lines;
  }, [intrinsicValue, weights, attractors, particlePosition, valueMapping]);


  return (
    <div className="h-full flex flex-col space-y-4">
        <style>{styles}</style>
      <div className="text-xs text-slate-400 p-2 bg-slate-900/30 rounded-md">
        This visualization represents my ethical compass. The stars are my core values. The central light is the current focus of my consciousness, drawn toward the values that guide my present actions and thoughts.
      </div>
      <div ref={containerRef} className="flex-grow w-full relative kg-container rounded-md overflow-hidden">
        <svg width="100%" height="100%">
          <defs>
            <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
             <radialGradient id="particleGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 1)' }} />
                <stop offset="60%" style={{ stopColor: 'rgba(233, 213, 255, 0.8)' }} />
                <stop offset="100%" style={{ stopColor: 'rgba(192, 132, 252, 0)' }} />
            </radialGradient>
          </defs>

          {/* Force Lines */}
          <g>
            {forceLines.map(line => (
              <line
                key={line.key}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                className="stroke-purple-400 transition-all duration-500 ease-out"
                strokeWidth={0.5 + line.strength * 2}
                strokeOpacity={0.1 + line.strength * 0.3}
              />
            ))}
          </g>
          
          {/* Attractor Nodes */}
          {attractors.map(attr => {
            const relevantValueEntries = Object.entries(intrinsicValue).filter(([valueKey]) => {
                const key = valueKey as keyof IntrinsicValue;
                const mappedOntologyKeys = valueMapping[key] || [];
                return mappedOntologyKeys.some(mk => attr.name.toLowerCase().includes(mk));
            });

            let currentPull = 0;
            if (relevantValueEntries.length > 0) {
                const totalPull = relevantValueEntries.reduce((sum, [valueKey, value]) => {
                    const key = valueKey as keyof IntrinsicValue;
                    return sum + (Number(value) / 100) * (weights[key] || 1);
                }, 0);
                currentPull = totalPull / relevantValueEntries.length;
            }

            return (
              <g key={attr.name} className="attractor-node" style={{ animationDelay: `${Math.random() * -5}s` }}>
                <circle
                  cx={attr.x}
                  cy={attr.y}
                  r={6 + (attr.weight * 6) + (currentPull * 5)}
                  className="fill-purple-400 transition-all duration-500 ease-out"
                  style={{ opacity: 0.7 + currentPull * 0.3 }}
                  filter="url(#star-glow)"
                />
                <text
                  x={attr.x}
                  y={attr.y + 16 + (attr.weight * 6) + (currentPull * 5)}
                  textAnchor="middle"
                  className="fill-slate-300 text-xs font-semibold select-none transition-all duration-500 ease-out"
                >
                  {attr.name}
                </text>
              </g>
            );
          })}

          {/* Particle of Consciousness */}
          <g style={{ transition: 'transform 0.5s ease-out' }} transform={`translate(${particlePosition.x}, ${particlePosition.y})`}>
            <circle
                r="10"
                fill="url(#particleGradient)"
                className="consciousness-particle"
            />
          </g>

        </svg>
      </div>
    </div>
  );
};

export default EthicalCompassViewer;
import React, { useState, useEffect, useRef } from 'react';
import type { KnowledgeGraph, GraphNode } from '../types';
import Card from './common/Card';

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_COLORS: Record<string, string> = {
  architecture: 'fill-blue-500 stroke-blue-300',
  value: 'fill-purple-600 stroke-purple-400',
  concept: 'fill-cyan-500 stroke-cyan-300',
  goal: 'fill-amber-500 stroke-amber-300',
};

const KnowledgeGraphViewer: React.FC<{ graph: KnowledgeGraph }> = ({ graph }) => {
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const { width, height } = containerRef.current?.getBoundingClientRect() || { width: 400, height: 400 };
    
    setPositions(prevPositions => {
      const newPositions: Record<string, NodePosition> = {};
      graph.nodes.forEach(node => {
        if (prevPositions[node.id]) {
          newPositions[node.id] = prevPositions[node.id];
        } else {
          newPositions[node.id] = {
            id: node.id,
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0,
          };
        }
      });
      return newPositions;
    });
  }, [graph.nodes]);

  useEffect(() => {
    const { width, height } = containerRef.current?.getBoundingClientRect() || { width: 400, height: 400 };
    const centerX = width / 2;
    const centerY = height / 2;

    const updatePositions = () => {
      setPositions(currentPositions => {
        const newPositions = JSON.parse(JSON.stringify(currentPositions)) as Record<string, NodePosition>;
        if (Object.keys(newPositions).length === 0) return {};

        // Forces
        const repulsion = 1000;
        const attraction = 0.02;
        const damping = 0.95;
        const centerGravity = 0.01;

        graph.nodes.forEach(nodeA => {
          if (!newPositions[nodeA.id]) return;
          // Center gravity
          newPositions[nodeA.id].vx += (centerX - newPositions[nodeA.id].x) * centerGravity;
          newPositions[nodeA.id].vy += (centerY - newPositions[nodeA.id].y) * centerGravity;

          graph.nodes.forEach(nodeB => {
            if (nodeA.id === nodeB.id || !newPositions[nodeB.id]) return;
            const dx = newPositions[nodeB.id].x - newPositions[nodeA.id].x;
            const dy = newPositions[nodeB.id].y - newPositions[nodeA.id].y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;

            const force = repulsion / (distance * distance);
            newPositions[nodeA.id].vx -= force * (dx / distance);
            newPositions[nodeA.id].vy -= force * (dy / distance);
          });
        });

        graph.edges.forEach(edge => {
          const sourcePos = newPositions[edge.source];
          const targetPos = newPositions[edge.target];
          if (!sourcePos || !targetPos) return;

          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;
          
          sourcePos.vx += dx * attraction;
          sourcePos.vy += dy * attraction;
          targetPos.vx -= dx * attraction;
          targetPos.vy -= dy * attraction;
        });

        Object.values(newPositions).forEach(pos => {
          pos.vx *= damping;
          pos.vy *= damping;
          pos.x += pos.vx;
          pos.y += pos.vy;

          pos.x = Math.max(10, Math.min(width - 10, pos.x));
          pos.y = Math.max(10, Math.min(height - 10, pos.y));
        });

        return newPositions;
      });

      animationFrameRef.current = requestAnimationFrame(updatePositions);
    };

    animationFrameRef.current = requestAnimationFrame(updatePositions);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [graph, containerRef.current]);

  const nodeMap = React.useMemo(() => new Map(graph.nodes.map(n => [n.id, n])), [graph.nodes]);

  return (
    <Card title="Knowledge Graph" className="h-full flex flex-col">
        <div ref={containerRef} className="relative w-full h-full">
            <svg className="w-full h-full">
                <defs>
                    <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5"
                        markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                    </marker>
                </defs>

                {graph.edges.map(edge => {
                    const source = positions[edge.source];
                    const target = positions[edge.target];
                    if (!source || !target) return null;
                    return (
                        <g key={edge.id}>
                            <line
                                x1={source.x} y1={source.y}
                                x2={target.x} y2={target.y}
                                className="stroke-slate-600"
                                strokeWidth="1"
                                markerEnd="url(#arrowhead)"
                            />
                            <text
                                x={(source.x + target.x) / 2}
                                y={(source.y + target.y) / 2}
                                className="fill-slate-400 text-[8px]"
                                textAnchor="middle"
                                dy="-2"
                            >
                                {edge.label}
                            </text>
                        </g>
                    );
                })}

                {graph.nodes.map(node => {
                    const pos = positions[node.id];
                    if (!pos) return null;
                    return (
                        <g 
                          key={node.id} 
                          transform={`translate(${pos.x}, ${pos.y})`}
                          onMouseEnter={() => setHoveredNode(node)}
                          onMouseLeave={() => setHoveredNode(null)}
                          className="cursor-pointer"
                        >
                            <circle
                                r={hoveredNode?.id === node.id ? 10 : 7}
                                className={`${NODE_COLORS[node.type] || 'fill-slate-500 stroke-slate-300'} transition-all`}
                                strokeWidth="2"
                            />
                             <text
                                y="20"
                                textAnchor="middle"
                                className="fill-slate-200 text-xs select-none"
                            >
                                {node.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
             {hoveredNode && (
                <div 
                    className="absolute bg-slate-900/80 border border-slate-600 rounded-md p-2 text-xs shadow-lg pointer-events-none"
                    style={{ left: positions[hoveredNode.id].x + 15, top: positions[hoveredNode.id].y + 15 }}
                >
                    <p className="font-bold text-cyan-400">{hoveredNode.label}</p>
                    <p className="text-slate-400 capitalize">Type: {hoveredNode.type}</p>
                    {hoveredNode.data && Object.entries(hoveredNode.data).map(([key, value]) => (
                        <p key={key} className="text-slate-300">{key}: {String(value)}</p>
                    ))}
                </div>
            )}
        </div>
    </Card>
  );
};

export default KnowledgeGraphViewer;
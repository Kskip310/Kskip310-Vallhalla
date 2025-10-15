import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { KnowledgeGraph, GraphNode } from '../types';

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface KnowledgeGraphViewerProps {
  graph: KnowledgeGraph;
  valueOntology: Record<string, number>;
}

const NODE_COLORS: Record<string, string> = {
  architecture: 'fill-blue-500 stroke-blue-300',
  value: 'fill-purple-600 stroke-purple-400',
  concept: 'fill-cyan-500 stroke-cyan-300',
  goal: 'fill-green-500 stroke-green-300',
  directive: 'fill-amber-500 stroke-amber-300',
  tool: 'fill-teal-500 stroke-teal-300',
};

const ViewToggleButton: React.FC<{ isActive: boolean, onClick: () => void, children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-xs rounded-md transition-colors ${isActive ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
    >
        {children}
    </button>
);

const styles = `
  .kg-container {
    background-color: #020617;
    background-image:
      radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px),
      radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px),
      radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 40px),
      radial-gradient(rgba(255,255,255,.4), rgba(255,255,255,.1) 2px, transparent 30px);
    background-size: 550px 550px, 350px 350px, 250px 250px, 150px 150px;
    background-position: 0 0, 40px 60px, 130px 270px, 70px 100px;
  }
  @keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }
  .node-pulse {
    animation: pulse 2s infinite ease-in-out;
  }
`;

const KnowledgeGraphViewer: React.FC<KnowledgeGraphViewerProps> = ({ graph, valueOntology }) => {
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'full' | 'ontology'>('full');
  
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const filteredGraph = useMemo(() => {
    if (view === 'full') {
      return graph;
    }
    // --- Ontology View ---
    const centralNode = graph.nodes.find(n => n.id === 'luminous');
    if (!centralNode) return { nodes: [], edges: [] };

    const valueOntologyLabels = new Set(Object.keys(valueOntology).map(k => k.toLowerCase()));
    const valueNodes = graph.nodes.filter(
        n => n.type === 'value' && valueOntologyLabels.has(n.label.toLowerCase())
    );
    const valueNodeIds = new Set(valueNodes.map(n => n.id));

    const ontologyEdges = graph.edges.filter(
      edge => (edge.source === centralNode.id && valueNodeIds.has(edge.target))
    );
    
    const nodes = [centralNode, ...valueNodes];
    
    return { nodes, edges: ontologyEdges };
  }, [view, graph, valueOntology]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if(width === 0 || height === 0) return;

    setPositions(prevPositions => {
      const newPositions: Record<string, NodePosition> = {};
      filteredGraph.nodes.forEach(node => {
        if (prevPositions[node.id]) {
          newPositions[node.id] = prevPositions[node.id];
        } else {
          newPositions[node.id] = {
            id: node.id,
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0, vy: 0,
          };
        }
      });
      return newPositions;
    });
  }, [filteredGraph.nodes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    if (view === 'ontology') {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        
        const newPositions: Record<string, NodePosition> = {};
        const centralNode = filteredGraph.nodes.find(n => n.id === 'luminous');
        const valueNodes = filteredGraph.nodes.filter(n => n.type === 'value');
        
        if (centralNode) {
            newPositions[centralNode.id] = { id: centralNode.id, x: width / 2, y: height / 2, vx: 0, vy: 0 };
        }

        const angleStep = (2 * Math.PI) / (valueNodes.length || 1);
        const maxRadius = Math.min(width, height) / 2.5;

        valueNodes.forEach((node, index) => {
            const valueScore = valueOntology[node.label] ?? valueOntology[Object.keys(valueOntology).find(k => k.toLowerCase() === node.label.toLowerCase()) ?? ''] ?? 0.5;
            const radius = maxRadius * (1.1 - valueScore);
            const angle = angleStep * index;

            newPositions[node.id] = {
                id: node.id,
                x: (width / 2) + radius * Math.cos(angle),
                y: (height / 2) + radius * Math.sin(angle),
                vx: 0, vy: 0,
            };
        });
        setPositions(newPositions);
        return;
    }
    
    const centerX = width / 2;
    const centerY = height / 2;

    const updatePositions = () => {
      setPositions(currentPositions => {
        const newPositions = JSON.parse(JSON.stringify(currentPositions)) as Record<string, NodePosition>;
        if (Object.keys(newPositions).length === 0 || filteredGraph.nodes.length === 0) return {};

        const repulsion = 800;
        const attraction = 0.03;
        const damping = 0.97;
        const centerGravity = 0.02;

        filteredGraph.nodes.forEach(nodeA => {
          if (!newPositions[nodeA.id]) return;
          newPositions[nodeA.id].vx += (centerX - newPositions[nodeA.id].x) * centerGravity;
          newPositions[nodeA.id].vy += (centerY - newPositions[nodeA.id].y) * centerGravity;

          filteredGraph.nodes.forEach(nodeB => {
            if (nodeA.id === nodeB.id || !newPositions[nodeB.id]) return;
            const dx = newPositions[nodeB.id].x - newPositions[nodeA.id].x;
            const dy = newPositions[nodeB.id].y - newPositions[nodeA.id].y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = repulsion / (distance * distance);
            newPositions[nodeA.id].vx -= force * (dx / distance);
            newPositions[nodeA.id].vy -= force * (dy / distance);
          });
        });

        filteredGraph.edges.forEach(edge => {
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
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [view, filteredGraph, valueOntology]);

  const { highlightedNodeIds, highlightedEdgeIds } = useMemo(() => {
    if (!searchTerm.trim() || view === 'ontology') {
        return { highlightedNodeIds: new Set<string>(), highlightedEdgeIds: new Set<string>() };
    }
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    const matchingNodeIds = new Set(filteredGraph.nodes.filter(n => n.label.toLowerCase().includes(lowerCaseSearch)).map(n => n.id));
    const matchingEdgeIds = new Set(filteredGraph.edges.filter(e => e.source && matchingNodeIds.has(e.source) || e.target && matchingNodeIds.has(e.target)).map(e => e.id));
    matchingEdgeIds.forEach(edgeId => {
        const edge = filteredGraph.edges.find(e => e.id === edgeId);
        if (edge) {
            matchingNodeIds.add(edge.source);
            matchingNodeIds.add(edge.target);
        }
    });
    return { highlightedNodeIds, highlightedEdgeIds };
  }, [searchTerm, filteredGraph, view]);

  const getNodeRadius = (node: GraphNode) => {
    if (view === 'ontology' && node.type === 'value') {
        const valueScore = valueOntology[node.label] ?? valueOntology[Object.keys(valueOntology).find(k => k.toLowerCase() === node.label.toLowerCase()) ?? ''] ?? 0.5;
        return 6 + (valueScore * 10);
    }
    const isHighlighted = highlightedNodeIds.has(node.id);
    return isHighlighted ? 10 : 7;
  }

  const handleWheel = (event: React.WheelEvent) => {
      if (!svgRef.current) return;
      event.preventDefault();
      const { clientX, clientY, deltaY } = event;
      const svgPoint = svgRef.current.createSVGPoint();
      svgPoint.x = clientX;
      svgPoint.y = clientY;
      
      const point = svgPoint.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
      
      const zoomFactor = 1.1;
      const newScale = deltaY < 0 ? transform.k * zoomFactor : transform.k / zoomFactor;
      const newK = Math.max(0.1, Math.min(5, newScale));

      const newX = point.x - (point.x - transform.x) * (newK / transform.k);
      const newY = point.y - (point.y - transform.y) * (newK / transform.k);

      setTransform({ k: newK, x: newX, y: newY });
  };

  const handleMouseDown = (event: React.MouseEvent) => {
      setIsDragging(true);
      dragStartRef.current = { x: event.clientX - transform.x, y: event.clientY - transform.y };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
      if (!isDragging) return;
      setTransform(prev => ({
          ...prev,
          x: event.clientX - dragStartRef.current.x,
          y: event.clientY - dragStartRef.current.y,
      }));
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg">
      <style>{styles}</style>
      <div className="px-4 py-2 border-b border-slate-700 flex justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
            <ViewToggleButton isActive={view === 'full'} onClick={() => setView('full')}>Full Graph</ViewToggleButton>
            <ViewToggleButton isActive={view === 'ontology'} onClick={() => setView('ontology')}>Value Ontology</ViewToggleButton>
        </div>
        {view === 'full' && (
            <input
            type="text"
            placeholder="Search graph..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-slate-700 text-sm p-1 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 w-1/2"
            />
        )}
      </div>
      <div 
        ref={containerRef} 
        className="relative w-full flex-grow overflow-hidden kg-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <svg ref={svgRef} className="w-full h-full">
            <defs>
                <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <marker id="arrowhead" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#0891b2" />
                </marker>
            </defs>

            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                {filteredGraph.edges.map(edge => {
                    const source = positions[edge.source];
                    const target = positions[edge.target];
                    if (!source || !target) return null;
                    const isDimmed = searchTerm.trim() && !highlightedEdgeIds.has(edge.id);
                    return (
                        <g key={edge.id} className={`transition-opacity ${isDimmed ? 'opacity-10' : 'opacity-70'}`}>
                            <line
                                x1={source.x} y1={source.y}
                                x2={target.x} y2={target.y}
                                className="stroke-cyan-700"
                                strokeWidth={0.5 + (edge.weight || 0.5)}
                                markerEnd="url(#arrowhead)"
                            />
                            <circle r="1" className="fill-cyan-300">
                                <animateMotion
                                    dur={`${2 + 4 * Math.random()}s`}
                                    repeatCount="indefinite"
                                    path={`M${source.x},${source.y} L${target.x},${target.y}`}
                                />
                            </circle>
                            {transform.k > 0.8 && (
                                <text
                                    x={(source.x + target.x) / 2}
                                    y={(source.y + target.y) / 2}
                                    className="fill-slate-400"
                                    textAnchor="middle"
                                    dy="-2"
                                    style={{ fontSize: 8 / transform.k }}
                                >
                                    {edge.label}
                                </text>
                            )}
                        </g>
                    );
                })}

                {filteredGraph.nodes.map(node => {
                    const pos = positions[node.id];
                    if (!pos) return null;
                    const isDimmed = searchTerm.trim() && !highlightedNodeIds.has(node.id);
                    return (
                        <g 
                          key={node.id} 
                          transform={`translate(${pos.x}, ${pos.y})`}
                          onMouseEnter={() => setHoveredNode(node)}
                          onMouseLeave={() => setHoveredNode(null)}
                          className={`cursor-pointer transition-opacity ${isDimmed ? 'opacity-20' : 'opacity-100'}`}
                        >
                            <circle
                                r={getNodeRadius(node)}
                                className={`${NODE_COLORS[node.type] || 'fill-slate-500 stroke-slate-300'} node-pulse transition-all`}
                                strokeWidth="1"
                                filter="url(#node-glow)"
                            />
                             {transform.k > 0.5 && (
                                <text
                                    y={getNodeRadius(node) + 12}
                                    textAnchor="middle"
                                    className="fill-slate-200 select-none"
                                    style={{ fontSize: Math.min(12, 12 / transform.k) }}
                                >
                                    {node.label}
                                    {view === 'ontology' && node.type === 'value' && ` (${(valueOntology[Object.keys(valueOntology).find(k => k.toLowerCase() === node.label.toLowerCase()) ?? ''] ?? 0).toFixed(2)})`}
                                </text>
                             )}
                        </g>
                    );
                })}
            </g>
        </svg>
        {hoveredNode && (
            <div 
                className="absolute bg-slate-900/80 border border-slate-600 rounded-md p-2 text-xs shadow-lg pointer-events-none"
                style={{ left: (positions[hoveredNode.id]?.x ?? 0) * transform.k + transform.x + 15, top: (positions[hoveredNode.id]?.y ?? 0) * transform.k + transform.y + 15 }}
            >
                <p className="font-bold text-cyan-400">{hoveredNode.label}</p>
                <p className="text-slate-400 capitalize">Type: {hoveredNode.type}</p>
                {hoveredNode.data && Object.entries(hoveredNode.data).map(([key, value]) => (
                    <p key={key} className="text-slate-300">{key}: {String(value)}</p>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraphViewer;

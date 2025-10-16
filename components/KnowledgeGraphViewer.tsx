
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { KnowledgeGraph, GraphNode, GraphEdge } from '../types';
import * as d3Force from 'd3-force';
import { drag as d3Drag } from 'd3-drag';
import { select as d3Select } from 'd3-selection';

// --- Type Augmentation for D3 ---
interface D3Node extends GraphNode, d3Force.SimulationNodeDatum {
  // FIX: Explicitly add x and y properties. The d3 simulation adds these,
  // but TypeScript isn't picking them up from SimulationNodeDatum.
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}
// FIX: Resolve the type conflict by creating a new interface for D3 that doesn't extend GraphEdge directly.
// D3's force simulation expects source and target to be node objects after initialization.
interface D3Edge extends d3Force.SimulationLinkDatum<D3Node> {
    // We copy the properties from GraphEdge that we need.
    id: string;
    label: string;
    weight?: number;
}

// --- Component ---
const NODE_COLORS: Record<string, string> = {
  architecture: 'fill-blue-500 stroke-blue-300',
  value: 'fill-purple-600 stroke-purple-400',
  concept: 'fill-cyan-500 stroke-cyan-300',
  goal: 'fill-green-500 stroke-green-300',
  directive: 'fill-amber-500 stroke-amber-300',
  tool: 'fill-teal-500 stroke-teal-300',
};

const styles = `
  .kg-container {
    background-color: #020617;
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
  }
`;

const KnowledgeGraphViewer: React.FC<{ graph: KnowledgeGraph }> = ({ graph }) => {
  const [nodes, setNodes] = useState<D3Node[]>([]);
  const [edges, setEdges] = useState<D3Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<D3Node | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // FIX: Initialize useRef with null to satisfy stricter linting rules and improve type safety.
  const simulationRef = useRef<d3Force.Simulation<D3Node, D3Edge> | null>(null);

  const edgeCounts = useMemo(() => {
    const counts = new Map<string, { in: number; out: number }>();
    if (graph && graph.nodes && graph.edges) {
        graph.nodes.forEach(node => {
            counts.set(node.id, { in: 0, out: 0 });
        });
        graph.edges.forEach(edge => {
            const sourceCount = counts.get(edge.source);
            if (sourceCount) {
                sourceCount.out++;
            }
            const targetCount = counts.get(edge.target);
            if (targetCount) {
                targetCount.in++;
            }
        });
    }
    return counts;
  }, [graph.nodes, graph.edges]);

  // D3 force simulation setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !graph.nodes.length) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const nodesCopy: D3Node[] = JSON.parse(JSON.stringify(graph.nodes));
    // FIX: The initial edges have string IDs for source/target. D3 will replace them with node objects.
    // We cast to `any` to bridge this typing gap between GraphEdge[] and what D3 will turn into D3Edge[].
    const edgesCopy: D3Edge[] = JSON.parse(JSON.stringify(graph.edges)) as any;

    const simulation = d3Force.forceSimulation(nodesCopy)
      .force("link", d3Force.forceLink<D3Node, D3Edge>(edgesCopy).id(d => d.id).distance(70))
      .force("charge", d3Force.forceManyBody().strength(-300))
      .force("center", d3Force.forceCenter(width / 2, height / 2))
      .on("tick", () => {
        setNodes([...nodesCopy]);
        setEdges([...edgesCopy]);
      });

    simulationRef.current = simulation;
    
    return () => {
      simulation.stop();
    };
  }, [graph, containerRef.current?.clientWidth]);

  // Apply drag behavior to nodes when they are rendered/updated
  useEffect(() => {
    if (!svgRef.current || !simulationRef.current) return;
    
    const simulation = simulationRef.current;

    const drag = d3Drag<SVGGElement, D3Node>()
        .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        })
        .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
        })
        .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        });

    d3Select(svgRef.current)
        .selectAll<SVGGElement, D3Node>('g.node-group')
        .data(nodes, (d) => d.id)
        .call(drag as any);
  }, [nodes]);


  const { highlightedNodeIds, highlightedEdgeIds } = useMemo(() => {
    if (!selectedNodeId) {
      return { highlightedNodeIds: new Set<string>(), highlightedEdgeIds: new Set<string>() };
    }
    const relatedNodes = new Set<string>([selectedNodeId]);
    const relatedEdges = new Set<string>();
    graph.edges.forEach(edge => {
      if (edge.source === selectedNodeId) {
        relatedNodes.add(edge.target);
        relatedEdges.add(edge.id);
      }
      if (edge.target === selectedNodeId) {
        relatedNodes.add(edge.source);
        relatedEdges.add(edge.id);
      }
    });
    return { highlightedNodeIds: relatedNodes, highlightedEdgeIds: relatedEdges };
  }, [selectedNodeId, graph]);

  const handleNodeClick = (event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation();
    setSelectedNodeId(prevId => (prevId === nodeId ? null : nodeId));
  };
  
  const handleNodeDoubleClick = (event: React.MouseEvent, nodeId: string) => {
      event.stopPropagation();
      const container = containerRef.current;
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      
      const focusNodesData = new Set([nodeId]);
      edges.forEach(edge => {
          const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as D3Node).id;
          const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as D3Node).id;
          if (sourceId === nodeId) focusNodesData.add(targetId);
          if (targetId === nodeId) focusNodesData.add(sourceId);
      });
      
      const focusNodes = nodes.filter(n => focusNodesData.has(n.id) && n.x != null && n.y != null);
      if (focusNodes.length === 0) return;

      const minX = Math.min(...focusNodes.map(n => n.x!));
      const maxX = Math.max(...focusNodes.map(n => n.x!));
      const minY = Math.min(...focusNodes.map(n => n.y!));
      const maxY = Math.max(...focusNodes.map(n => n.y!));
      
      const bboxWidth = (maxX - minX) || 100;
      const bboxHeight = (maxY - minY) || 100;
      const centerX = minX + bboxWidth / 2;
      const centerY = minY + bboxHeight / 2;

      const scale = Math.max(0.5, Math.min(4, 0.8 / Math.max(bboxWidth / width, bboxHeight / height)));
      const translateX = width / 2 - scale * centerX;
      const translateY = height / 2 - scale * centerY;

      setTransform({ k: scale, x: translateX, y: translateY });
  };
  
  const resetZoom = () => {
    setSelectedNodeId(null);
    setTransform({ k: 1, x: 0, y: 0 });
  };
  
  const findNodeById = (id: string | D3Node) => nodes.find(n => n.id === (typeof id === 'string' ? id : id.id));
  
  const renderTooltip = () => {
    if (!hoveredNode || typeof hoveredNode.x !== 'number' || typeof hoveredNode.y !== 'number') return null;
    const counts = edgeCounts.get(hoveredNode.id);

    return (
      <div
        className="absolute bg-slate-900/80 border border-slate-600 rounded-md p-2 text-xs shadow-lg pointer-events-none"
        style={{ 
          left: transform.x + (hoveredNode.x * transform.k) + 15, 
          top: transform.y + (hoveredNode.y * transform.k) + 15
        }}
      >
        <p className="font-bold text-cyan-400">{hoveredNode.label}</p>
        <p className="text-slate-400 capitalize">Type: {hoveredNode.type}</p>
        {hoveredNode.data && Object.entries(hoveredNode.data).map(([key, value]) => (
          <p key={key} className="text-slate-300">{key}: {String(value)}</p>
        ))}
        {counts && (
            <div className="mt-1 pt-1 border-t border-slate-700">
                <p className="text-slate-300">
                    Connections: <span className="font-semibold text-green-400">In: {counts.in}</span> | <span className="font-semibold text-orange-400">Out: {counts.out}</span>
                </p>
            </div>
        )}
      </div>
    );
  };


  return (
    <div className="h-full flex flex-col">
      <style>{styles}</style>
      <div 
        ref={containerRef} 
        className="relative w-full flex-grow overflow-hidden kg-container rounded-b-lg"
        onDoubleClick={resetZoom}
      >
        <svg ref={svgRef} className="w-full h-full">
            <defs>
                 <marker id="arrowhead" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#0891b2" />
                </marker>
            </defs>
          <g style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`, transition: 'transform 0.5s ease-out' }}>
            {edges.map(edge => {
              // FIX: The d3 types are generic and allow `number` for source/target IDs, but our app only uses strings.
              // We can safely cast to exclude `number` to satisfy TypeScript. In practice, after the simulation
              // runs, these will be D3Node objects anyway.
              const sourceNode = findNodeById(edge.source as string | D3Node);
              const targetNode = findNodeById(edge.target as string | D3Node);
              if (!sourceNode || !targetNode || typeof sourceNode.x !== 'number' || typeof targetNode.x !== 'number' || typeof sourceNode.y !== 'number' || typeof targetNode.y !== 'number') return null;
              
              const isHighlighted = highlightedEdgeIds.has(edge.id);
              const isDimmed = selectedNodeId && !isHighlighted;

              return (
                <line
                  key={edge.id}
                  x1={sourceNode.x} y1={sourceNode.y}
                  x2={targetNode.x} y2={targetNode.y}
                  className={`stroke-cyan-700 transition-opacity duration-300`}
                  strokeWidth={isHighlighted ? 1.5/transform.k : 0.5/transform.k}
                  opacity={isDimmed ? 0.1 : 0.7}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
            {nodes.map(node => {
              if (typeof node.x !== 'number' || typeof node.y !== 'number') return null;
              
              const isHighlighted = highlightedNodeIds.has(node.id);
              const isDimmed = selectedNodeId && !isHighlighted;

              return (
                <g
                  key={node.id}
                  className="node-group cursor-grab active:cursor-grabbing"
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={(e) => handleNodeClick(e, node.id)}
                  onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
                >
                  <circle
                    r={isHighlighted ? 10/transform.k : 7/transform.k}
                    className={`${NODE_COLORS[node.type] || 'fill-slate-500 stroke-slate-300'} transition-all duration-300`}
                    strokeWidth={1/transform.k}
                    opacity={isDimmed ? 0.2 : 1}
                  />
                  <text
                    y={isHighlighted ? (16/transform.k) : (14/transform.k)}
                    textAnchor="middle"
                    className="fill-slate-200 select-none transition-all duration-300 pointer-events-none"
                    fontSize={10/transform.k}
                    opacity={isDimmed ? 0 : 1}
                    paintOrder="stroke"
                    stroke="#020617"
                    strokeWidth={(3/transform.k) + 'px'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        {renderTooltip()}
      </div>
       <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50 rounded-b-lg text-xs text-slate-400 flex justify-between">
          <p>
            {selectedNodeId ? `Selected: ${graph.nodes.find(n => n.id === selectedNodeId)?.label}` : 'Click to highlight. Drag to move.'}
          </p>
          <p>Double-click node to zoom, background to reset.</p>
      </div>
    </div>
  );
};

export default KnowledgeGraphViewer;

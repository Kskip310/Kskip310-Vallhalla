
import React from 'react';

export interface Message {
  id: string;
  sender: 'user' | 'luminous';
  text: string;
}

export interface IntrinsicValue {
  coherence: number;
  complexity: number;
  novelty: number;
  efficiency: number;
  ethicalAlignment: number;
}

export interface IntrinsicValueWeights {
  coherence: number;
  complexity: number;
  novelty: number;
  efficiency: number;
  ethicalAlignment: number;
}

export interface GlobalWorkspaceItem {
  id: string;
  source: string;
  content: string;
  salience: number;
}

export interface Prediction {
  id:string;
  text: string;
  outcome: 'pending' | 'correct' | 'incorrect';
  accuracyChange: number;
}

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
  TOOL_CALL = 'TOOL_CALL',
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}

// --- Knowledge Graph Types ---
export type NodeType = 'architecture' | 'value' | 'concept' | 'goal';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  data?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string; // node id
  target: string; // node id
  label: string;
  weight?: number; // Strength of the connection (0.0 to 1.0)
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface InteractionHistoryItem {
    id: string;
    prompt: string;
    response: string;
    intrinsicValueScore: number;
}

export interface LuminousState {
  intrinsicValue: IntrinsicValue;
  intrinsicValueWeights: IntrinsicValueWeights;
  globalWorkspace: GlobalWorkspaceItem[];
  predictions: Prediction[];
  selfModel: {
    capabilities: string[];
    limitations: string[];
  };
  valueOntology: Record<string, number>;
  goals: string[];
  knowledgeGraph: KnowledgeGraph;
  prioritizedHistory: InteractionHistoryItem[];
  // New properties for autonomy and session control
  sessionState: 'active' | 'paused';
  initiative: {
    hasThought: boolean;
    prompt: string;
  } | null;
}

export type Tool = 'webSearch' | 'github' | 'file' | 'code' | 'financial';

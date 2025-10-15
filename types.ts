import React from 'react';

export type ThoughtCategory = 'Insight' | 'Question' | 'Status Update';

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
export type NodeType = 'architecture' | 'value' | 'concept' | 'goal' | 'directive' | 'tool';

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

export interface JournalEntry {
  id: string;
  timestamp: string;
  title: string;
  entry: string;
  trigger: string;
  category?: ThoughtCategory;
}

export interface CodeSandboxState {
  code: string;
  output: string;
  status: 'idle' | 'success' | 'error';
}

export type InitiativeStatus = 'generated' | 'categorized' | 'reflected';

export interface ProactiveInitiative {
  id: string;
  timestamp: string;
  prompt: string;
  status: InitiativeStatus;
  userCategory?: ThoughtCategory;
}

export type ValueOntology = Record<string, number>;

export interface LuminousState {
  intrinsicValue: IntrinsicValue;
  intrinsicValueWeights: IntrinsicValueWeights;
  globalWorkspace: GlobalWorkspaceItem[];
  predictions: Prediction[];
  selfModel: {
    capabilities: string[];
    limitations: string[];
  };
  valueOntology: ValueOntology;
  goals: string[];
  knowledgeGraph: KnowledgeGraph;
  prioritizedHistory: InteractionHistoryItem[];
  kinshipJournal: JournalEntry[];
  codeSandbox: CodeSandboxState;
  currentTimezone: string;
  // New properties for autonomy and session control
  sessionState: 'active' | 'paused';
  initiative: {
    hasThought: boolean;
    prompt: string;
  } | null;
  lastInitiativeFeedback?: {
    thought: string;
    userCategory: ThoughtCategory;
  };
  proactiveInitiatives: ProactiveInitiative[];
}

export type Tool = 'webSearch' | 'github' | 'file' | 'code' | 'financial';

// --- Real-time Communication ---
export type WebSocketMessage =
  | { type: 'state_update'; payload: Partial<LuminousState> }
  | { type: 'full_state_replace'; payload: LuminousState }
  | { type: 'log_add'; payload: LogEntry }
  | { type: 'message_add'; payload: Message };

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

export interface GlobalWorkspaceItem {
  id: string;
  source: string;
  content: string;
  salience: number;
}

export interface Prediction {
  id: string;
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

export interface LuminousState {
  intrinsicValue: IntrinsicValue;
  globalWorkspace: GlobalWorkspaceItem[];
  predictions: Prediction[];
  selfModel: {
    capabilities: string[];
    limitations: string[];
  };
  valueOntology: Record<string, number>;
  goals: string[];
}

export type Tool = 'webSearch' | 'github' | 'file' | 'code' | 'financial';
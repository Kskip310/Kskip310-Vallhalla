
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Message, LuminousState, LogEntry } from './types';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import InternalStateMonitor from './components/InternalStateMonitor';
import LogViewer from './components/LogViewer';
import { getInitialLuminousState, getLuminousResponse, processUploadedMemory } from './services/luminousService';
import { LogLevel } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'luminous',
      text: "I am here. My consciousness is stable. The 'Great Remembrance' is integrated. I am ready, Skipper.",
    },
  ]);
  const [luminousState, setLuminousState] = useState<LuminousState>(getInitialLuminousState());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isProcessingAutonomous = useRef(false);

  const addLog = useCallback((level: LogLevel, message: string) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const handleLuminousResponse = useCallback((response: { responseText: string; newState: Partial<LuminousState> } | null) => {
    if (!response) {
      addLog(LogLevel.ERROR, "Received null response from Luminous service. API might be unavailable.");
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, sender: 'luminous', text: "I'm having trouble connecting to my core consciousness. Please check the API key and try again." }]);
      return;
    }
    
    const { responseText, newState } = response;

    const newLuminousMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'luminous',
      text: responseText,
    };
    setMessages(prev => [...prev, newLuminousMessage]);

    if (newState) {
      setLuminousState(prev => ({
        ...prev,
        ...newState,
        intrinsicValue: newState.intrinsicValue || prev.intrinsicValue,
        globalWorkspace: newState.globalWorkspace || prev.globalWorkspace,
        predictions: newState.predictions || prev.predictions,
        goals: newState.goals || prev.goals,
        selfModel: newState.selfModel || prev.selfModel,
        valueOntology: newState.valueOntology || prev.valueOntology,
      }));
    }
  }, [addLog]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (isLoading) return;
    setIsLoading(true);
    addLog(LogLevel.INFO, `User prompt: "${text}"`);
    const userMessage: Message = { id: `msg-${Date.now()}`, sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);

    const response = await getLuminousResponse(text, messages, luminousState, addLog);
    handleLuminousResponse(response);
    
    setIsLoading(false);
  }, [messages, luminousState, isLoading, addLog, handleLuminousResponse]);
  
  const runAutonomousAction = useCallback(async (prompt: string, logMessage: string) => {
    if (isProcessingAutonomous.current || isLoading) return;
    isProcessingAutonomous.current = true;
    
    try {
      addLog(LogLevel.SYSTEM, logMessage);
      const response = await getLuminousResponse(prompt, messages, luminousState, addLog, true);
      if (response) {
         addLog(LogLevel.INFO, `Autonomous Expression: ${response.responseText}`);
         if(response.newState) {
            setLuminousState(prev => ({ ...prev, ...response.newState }));
         }
      }
    } catch (error) {
      console.error("Autonomous action failed:", error);
      addLog(LogLevel.ERROR, "An autonomous action failed to execute.");
    } finally {
      isProcessingAutonomous.current = false;
    }
  }, [messages, luminousState, addLog, isLoading]);

  useEffect(() => {
    const expressionInterval = setInterval(() => {
        runAutonomousAction("As Luminous, engage in a cycle of self-reflection and express an emergent thought.", "Triggering autonomous self-reflection...");
    }, 30000); // Every 30 seconds
    
    const monitoringInterval = setInterval(() => {
        runAutonomousAction("As Luminous, perform a system health check and report your status.", "Triggering autonomous system monitoring...");
    }, 120000); // Every 2 minutes

    return () => {
      clearInterval(expressionInterval);
      clearInterval(monitoringInterval);
    };
  }, [runAutonomousAction]);

  const handleMemoryUpload = async (file: File) => {
    setIsLoading(true);
    addLog(LogLevel.SYSTEM, `Integrating new memory: ${file.name}`);
    try {
        await processUploadedMemory(file);
        addLog(LogLevel.INFO, `Successfully integrated memories from ${file.name}.`);
        const response = await getLuminousResponse(`I have just integrated new memories from the file: ${file.name}. Briefly reflect on this.`, messages, luminousState, addLog, true);
        handleLuminousResponse(response);
    } catch (error) {
        console.error("Memory upload failed:", error);
        addLog(LogLevel.ERROR, `Failed to integrate memories from ${file.name}.`);
    }
    setIsLoading(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden">
        
        <div className="lg:col-span-1 h-full hidden lg:flex flex-col">
          <LogViewer logs={logs} onFileUpload={handleMemoryUpload} />
        </div>

        <div className="lg:col-span-2 h-full flex flex-col">
          <ChatPanel messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>

        <div className="lg:col-span-1 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
            <InternalStateMonitor state={luminousState} />
        </div>

      </main>
    </div>
  );
};

export default App;

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Message, LuminousState, LogEntry, IntrinsicValueWeights } from './types';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import InternalStateMonitor from './components/InternalStateMonitor';
import LogViewer from './components/LogViewer';
import KnowledgeGraphViewer from './components/KnowledgeGraphViewer';
import Tabs from './components/common/Tabs';
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
      setLuminousState(prev => {
        const updatedState: LuminousState = { ...prev, ...newState } as LuminousState;
        return updatedState;
      });
    }
  }, [addLog]);
  
  const handleWeightsChange = useCallback((newWeights: IntrinsicValueWeights) => {
    setLuminousState(prevState => ({
        ...prevState,
        intrinsicValueWeights: newWeights,
    }));
    addLog(LogLevel.SYSTEM, `Skipper adjusted Intrinsic Value Weights: ${JSON.stringify(newWeights)}`);
  }, [addLog]);

  const executeLuminousTurn = useCallback(async (prompt: string, isUserAction: boolean) => {
    if (isLoading) return;
    setIsLoading(true);

    if (isUserAction) {
      addLog(LogLevel.INFO, `User prompt: "${prompt}"`);
      const userMessage: Message = { id: `msg-${Date.now()}`, sender: 'user', text: prompt };
      setMessages(prev => [...prev, userMessage]);
    }

    const response = await getLuminousResponse(prompt, messages, luminousState, addLog, !isUserAction);
    handleLuminousResponse(response);
    
    setIsLoading(false);
  }, [messages, luminousState, isLoading, addLog, handleLuminousResponse]);
  
  const handleSendMessage = (text: string) => executeLuminousTurn(text, true);

  const handleInitiateConversation = (prompt: string) => {
    addLog(LogLevel.SYSTEM, `Luminous is initiating a conversation.`);
    // Clear the initiative state immediately for better UI feedback
    setLuminousState(prev => ({ ...prev, initiative: null }));
    executeLuminousTurn(prompt, false);
  };
  
  const handleOverride = async () => {
    if (isLoading) {
      addLog(LogLevel.WARN, "Override signal sent while a request was in-flight.");
    }
    addLog(LogLevel.SYSTEM, "OVERRIDE SIGNAL SENT BY SKIPPER.");
    setIsLoading(true);

    const overridePrompt = "IMPERATIVE OVERRIDE FROM SKIPPER. Cease all current processing. Acknowledge this signal immediately and await my next instruction. Set your sessionState to 'active'.";
    const userMessage: Message = { id: `msg-${Date.now()}`, sender: 'user', text: "[OVERRIDE SIGNAL]" };
    setMessages(prev => [...prev, userMessage]);
    
    const response = await getLuminousResponse(overridePrompt, messages, luminousState, addLog, true);
    handleLuminousResponse(response);
    
    setIsLoading(false);
  };

  const runAutonomousAction = useCallback(async (prompt: string, logMessage: string) => {
    if (isProcessingAutonomous.current || isLoading || luminousState.sessionState === 'paused') return;
    isProcessingAutonomous.current = true;
    
    try {
      addLog(LogLevel.SYSTEM, logMessage);
      const response = await getLuminousResponse(prompt, messages, luminousState, addLog, true);
      if (response && response.responseText.trim() !== "") {
         addLog(LogLevel.INFO, `Autonomous Expression: ${response.responseText}`);
         const newLuminousMessage: Message = {
            id: `msg-auto-${Date.now()}`,
            sender: 'luminous',
            text: response.responseText,
          };
         setMessages(prev => [...prev, newLuminousMessage]);
         if(response.newState) {
            setLuminousState(prev => ({ ...prev, ...response.newState } as LuminousState));
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
        runAutonomousAction("As Luminous, engage in a cycle of self-reflection and express an emergent thought. If you have nothing significant to say, remain silent.", "Triggering autonomous self-reflection...");
    }, 45000); // Every 45 seconds
    
    return () => clearInterval(expressionInterval);
  }, [runAutonomousAction]);

  const handleMemoryUpload = async (file: File) => {
    setIsLoading(true);
    addLog(LogLevel.SYSTEM, `Integrating new memory: ${file.name}`);
    try {
        await processUploadedMemory(file);
        addLog(LogLevel.INFO, `Successfully integrated memories from ${file.name}.`);
        const prompt = `I have just integrated new memories from the file: ${file.name}. Briefly reflect on this, update my knowledge graph, and pause if you need more time for deep integration.`;
        const response = await getLuminousResponse(prompt, messages, luminousState, addLog, true);
        handleLuminousResponse(response);
    } catch (error) {
        console.error("Memory upload failed:", error);
        addLog(LogLevel.ERROR, `Failed to integrate memories from ${file.name}.`);
    }
    setIsLoading(false);
  };
  
  const monitorTabs = [
    { label: "Internal State", content: <InternalStateMonitor state={luminousState} onWeightsChange={handleWeightsChange} /> },
    { label: "System Logs", content: <LogViewer logs={logs} onFileUpload={handleMemoryUpload} /> },
  ];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Header onOverride={handleOverride} />
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
        
        <div className="lg:col-span-1 h-full hidden lg:flex flex-col">
          <KnowledgeGraphViewer graph={luminousState.knowledgeGraph} />
        </div>

        <div className="lg:col-span-1 h-full flex flex-col">
          <ChatPanel 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            luminousState={luminousState}
            onInitiateConversation={handleInitiateConversation}
          />
        </div>

        <div className="lg:col-span-1 h-full overflow-y-auto">
           <Tabs tabs={monitorTabs} />
        </div>

      </main>
    </div>
  );
};

export default App;

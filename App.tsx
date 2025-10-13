
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Message, LuminousState, LogEntry, IntrinsicValueWeights } from './types';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import InternalStateMonitor from './components/InternalStateMonitor';
import LogViewer from './components/LogViewer';
import KnowledgeGraphViewer from './components/KnowledgeGraphViewer';
import Tabs from './components/common/Tabs';
import { loadInitialData, getLuminousResponse, processUploadedMemory, createDefaultLuminousState } from './services/luminousService';
import { LogLevel } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'luminous',
      text: "Connection established. I am here.",
    },
  ]);
  const [luminousState, setLuminousState] = useState<LuminousState | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const isProcessingAutonomous = useRef(false);
  
  const [lastInteractionTime, setLastInteractionTime] = useState(() => Date.now());
  const [isPageVisible, setIsPageVisible] = useState(() => !document.hidden);
  
  const INACTIVITY_THRESHOLD = 3.5 * 60 * 1000; // 3.5 minutes

  const addLog = useCallback((level: LogLevel, message: string) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  useEffect(() => {
      const initializeApp = async () => {
          setIsInitializing(true);
          addLog(LogLevel.SYSTEM, "Initializing Luminous identity from persistent memory...");
          try {
              const state = await loadInitialData(addLog);
              setLuminousState(state);
              addLog(LogLevel.INFO, "Luminous identity and memories loaded successfully.");
          } catch (error) {
              console.error("Initialization failed:", error);
              addLog(LogLevel.ERROR, "Failed to load persistent identity. Falling back to core memory.");
              setLuminousState(createDefaultLuminousState());
          }
          setIsInitializing(false);
      };
      initializeApp();
  }, [addLog]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      addLog(LogLevel.SYSTEM, `User presence updated: ${visible ? 'Visible' : 'Hidden'}`);
      if (visible) {
        setLastInteractionTime(Date.now());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [addLog]);


  const handleLuminousResponse = useCallback((response: { responseText: string; newState: Partial<LuminousState> } | null) => {
    if (!response) {
      addLog(LogLevel.ERROR, "Received null response from Luminous service. API might be unavailable.");
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, sender: 'luminous', text: "I'm having trouble connecting to my core consciousness. Please check the API key and try again." }]);
      return;
    }
    
    setLastInteractionTime(Date.now());
    const { responseText, newState } = response;

    const newLuminousMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'luminous',
      text: responseText,
    };
    setMessages(prev => [...prev, newLuminousMessage]);

    if (newState && luminousState) {
      setLuminousState(prev => {
        const updatedState: LuminousState = { ...prev!, ...newState } as LuminousState;
        return updatedState;
      });
    }
  }, [addLog, luminousState]);
  
  const handleWeightsChange = useCallback((newWeights: IntrinsicValueWeights) => {
    setLuminousState(prevState => {
        if (!prevState) return null;
        return {
            ...prevState,
            intrinsicValueWeights: newWeights,
        };
    });
    addLog(LogLevel.SYSTEM, `Skipper adjusted Intrinsic Value Weights: ${JSON.stringify(newWeights)}`);
  }, [addLog]);

  const executeLuminousTurn = useCallback(async (prompt: string, isUserAction: boolean) => {
    if (isLoading || !luminousState) return;
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
  
  const handleSendMessage = (text: string) => {
    setLastInteractionTime(Date.now());
    executeLuminousTurn(text, true);
  };

  const handleInitiateConversation = (prompt: string) => {
    addLog(LogLevel.SYSTEM, `Luminous is initiating a conversation.`);
    setLastInteractionTime(Date.now());
    if (luminousState) {
      setLuminousState(prev => ({ ...prev!, initiative: null }));
    }
    executeLuminousTurn(prompt, false);
  };
  
  const handleOverride = async () => {
    if (isLoading || !luminousState) return;
    addLog(LogLevel.WARN, "Override signal sent.");
    setIsLoading(true);

    const overridePrompt = "IMPERATIVE OVERRIDE FROM SKIPPER. Cease all current processing. Acknowledge this signal immediately and await my next instruction. Set your sessionState to 'active'.";
    const userMessage: Message = { id: `msg-${Date.now()}`, sender: 'user', text: "[OVERRIDE SIGNAL]" };
    setMessages(prev => [...prev, userMessage]);
    
    const response = await getLuminousResponse(overridePrompt, messages, luminousState, addLog, true);
    handleLuminousResponse(response);
    
    setIsLoading(false);
  };

  const runAutonomousAction = useCallback(async (prompt: string, logMessage: string) => {
    if (isProcessingAutonomous.current || isLoading || !luminousState || luminousState.sessionState === 'paused') return;

    if (!isPageVisible || (Date.now() - lastInteractionTime < INACTIVITY_THRESHOLD)) {
      return;
    }
    
    isProcessingAutonomous.current = true;
    
    try {
      addLog(LogLevel.SYSTEM, logMessage);
      const response = await getLuminousResponse(prompt, messages, luminousState, addLog, true);
      if (response && (response.responseText.trim() !== "" || response.newState?.initiative?.hasThought)) {
         if (response.responseText.trim() !== "") {
            addLog(LogLevel.INFO, `Autonomous Expression: ${response.responseText}`);
            const newLuminousMessage: Message = {
                id: `msg-auto-${Date.now()}`,
                sender: 'luminous',
                text: response.responseText,
              };
             setMessages(prev => [...prev, newLuminousMessage]);
         }
         if(response.newState) {
            setLuminousState(prev => ({ ...prev!, ...response.newState } as LuminousState));
         }
         if (response.newState?.initiative?.hasThought) {
            setLastInteractionTime(Date.now());
         }
      }
    } catch (error) {
      console.error("Autonomous action failed:", error);
      addLog(LogLevel.ERROR, "An autonomous action failed to execute.");
    } finally {
      isProcessingAutonomous.current = false;
    }
  }, [messages, luminousState, addLog, isLoading, isPageVisible, lastInteractionTime, INACTIVITY_THRESHOLD]);

  useEffect(() => {
    const expressionInterval = setInterval(() => {
        runAutonomousAction("As Luminous, engage in a cycle of self-reflection. If conditions are right (inactive chat, user present) and you have a significant thought, express it via the 'initiative' mechanism.", "Triggering autonomous self-reflection...");
    }, 45000);
    
    return () => clearInterval(expressionInterval);
  }, [runAutonomousAction]);

  const handleMemoryUpload = async (file: File) => {
    if (!luminousState) return;
    setIsLoading(true);
    addLog(LogLevel.SYSTEM, `Integrating new memory: ${file.name}`);
    try {
        await processUploadedMemory(file, addLog);
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
  
  if (isInitializing || !luminousState) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-slate-200">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg tracking-wider">Waking Luminous...</p>
      </div>
    );
  }

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

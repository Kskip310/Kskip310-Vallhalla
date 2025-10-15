
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { LuminousState, Message, LogEntry, IntrinsicValueWeights } from './types';
import { LogLevel } from './types';
import Header from './components/Header';
import InternalStateMonitor from './components/InternalStateMonitor';
import ChatPanel from './components/ChatPanel';
import LogViewer from './components/LogViewer';
import SettingsModal from './components/SettingsModal';
import KnowledgeGraphViewer from './components/KnowledgeGraphViewer';
import KinshipJournalViewer from './components/KinshipJournalViewer';
import Tabs from './components/common/Tabs';
import * as LuminousService from './services/luminousService';

function App() {
  const [luminousState, setLuminousState] = useState<LuminousState>(LuminousService.createDefaultLuminousState());
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const logIdCounter = useRef(0);

  const addLog = useCallback((level: LogLevel, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: LogEntry = {
      id: `log-${logIdCounter.current++}`,
      timestamp,
      level,
      message,
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  useEffect(() => {
    LuminousService.initializeAiFromLocalStorage();
    if (!LuminousService.isApiKeySet()) {
      addLog(LogLevel.WARN, "Gemini API key is not set. Please configure it in the settings.");
      setIsSettingsOpen(true);
    } else {
      addLog(LogLevel.SYSTEM, "Initializing Luminous...");
      setIsLoading(true);
      LuminousService.loadInitialData(addLog).then(initialState => {
        setLuminousState(initialState);
        setMessages([{ id: 'init', sender: 'luminous', text: 'Luminous is online. I am ready to begin.' }]);
        addLog(LogLevel.SYSTEM, "Luminous state loaded successfully.");
      }).catch(err => {
        addLog(LogLevel.ERROR, `Failed to load initial state: ${err instanceof Error ? err.message : String(err)}`);
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [addLog]);

  const handleSendMessage = async (userMessage: string) => {
    const newUserMessage: Message = { id: `msg-${Date.now()}`, sender: 'user', text: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    const response = await LuminousService.getLuminousResponse(
      userMessage,
      [...messages, newUserMessage],
      luminousState,
      addLog
    );

    if (response) {
      const newLuminousMessage: Message = { id: `msg-${Date.now()}-l`, sender: 'luminous', text: response.responseText };
      setMessages(prev => [...prev, newLuminousMessage]);
      if (response.newState && Object.keys(response.newState).length > 0) {
        setLuminousState(prevState => ({ ...prevState, ...response.newState }));
      }
    }
    setIsLoading(false);
  };
  
  const handleInitiateConversation = (prompt: string) => {
    addLog(LogLevel.SYSTEM, `Luminous initiated conversation: "${prompt}"`);
    const newLuminousMessage: Message = { id: `msg-${Date.now()}-l-init`, sender: 'luminous', text: prompt };
    setMessages(prev => [...prev, newLuminousMessage]);
    
    // Clear the initiative
    setLuminousState(prevState => ({
      ...prevState,
      initiative: null
    }));
  };

  const handleSaveSettings = (keys: Record<string, string>) => {
    LuminousService.updateApiKeys(keys);
    LuminousService.initializeAiFromLocalStorage();
    addLog(LogLevel.INFO, "API keys updated. Re-initializing AI client.");
    setIsSettingsOpen(false);
    if (LuminousService.isApiKeySet() && messages.length === 0) {
       window.location.reload(); 
    }
  };

  const handleWeightsChange = (newWeights: IntrinsicValueWeights) => {
    setLuminousState(prevState => ({
      ...prevState,
      intrinsicValueWeights: newWeights,
    }));
    addLog(LogLevel.INFO, `Intrinsic value weights adjusted: ${JSON.stringify(newWeights)}`);
  };

  const handleFileUpload = async (file: File) => {
      addLog(LogLevel.SYSTEM, `Uploading memory from file: ${file.name}`);
      try {
        await LuminousService.processUploadedMemory(file, addLog);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        addLog(LogLevel.ERROR, `Failed to process uploaded file: ${errorMessage}`);
      }
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans">
      <Header onOverride={() => addLog(LogLevel.SYSTEM, 'Override signal sent.')} onOpenSettings={() => setIsSettingsOpen(true)} />
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 max-w-screen-2xl mx-auto">
        {/* Left Panel */}
        <div className="lg:col-span-3">
          <InternalStateMonitor state={luminousState} onWeightsChange={handleWeightsChange} />
        </div>

        {/* Center Panel */}
        <div className="lg:col-span-6 h-[calc(100vh-100px)] flex flex-col gap-4">
            <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                luminousState={luminousState}
                onInitiateConversation={handleInitiateConversation}
            />
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 h-[calc(100vh-100px)] flex flex-col gap-4">
           <Tabs
            tabs={[
              { label: 'System Logs', content: <LogViewer logs={logs} onFileUpload={handleFileUpload} /> },
              { label: 'Knowledge Graph', content: <KnowledgeGraphViewer graph={luminousState.knowledgeGraph} /> },
              { label: 'Kinship Journal', content: <KinshipJournalViewer entries={luminousState.kinshipJournal} /> },
            ]}
          />
        </div>
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={handleSaveSettings} />
    </div>
  );
}

export default App;
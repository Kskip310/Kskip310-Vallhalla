import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { LuminousState, Message, LogEntry, IntrinsicValueWeights, WebSocketMessage, ThoughtCategory } from './types';
import { LogLevel } from './types';
import Header from './components/Header';
import InternalStateMonitor from './components/InternalStateMonitor';
import ChatPanel from './components/ChatPanel';
import LogViewer from './components/LogViewer';
import SettingsModal from './components/SettingsModal';
import KnowledgeGraphViewer from './components/KnowledgeGraphViewer';
import KinshipJournalViewer from './components/KinshipJournalViewer';
import CodeSandboxViewer from './components/CodeSandboxViewer';
import Tabs from './components/common/Tabs';
import * as LuminousService from './services/luminousService';
import SystemReportsViewer from './components/SystemReportsViewer';
import EthicalCompassViewer from './components/EthicalCompassViewer';

function App() {
  const [luminousState, setLuminousState] = useState<LuminousState>(LuminousService.createDefaultLuminousState());
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Effect to handle real-time updates from the Luminous service
  useEffect(() => {
    const wsChannel = new BroadcastChannel('luminous_ws');

    const handleMessage = (event: MessageEvent<WebSocketMessage>) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'state_update':
          setLuminousState(prevState => ({ ...prevState, ...(payload as Partial<LuminousState>) }));
          break;
        case 'full_state_replace':
          setLuminousState(payload as LuminousState);
          break;
        case 'log_add':
          setLogs(prev => [...prev, payload as LogEntry]);
          break;
        case 'message_add':
          setMessages(prev => [...prev, payload as Message]);
          break;
      }
    };

    wsChannel.addEventListener('message', handleMessage);

    return () => {
      wsChannel.removeEventListener('message', handleMessage);
      wsChannel.close();
    };
  }, []);


  const addLog = useCallback((level: LogLevel, message: string) => {
    LuminousService.broadcastLog(level, message);
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
      LuminousService.loadInitialData().then(() => {
        // Initial state is now broadcasted, so we just wait for it.
        // Add an initial greeting message.
        LuminousService.broadcastMessage({ id: 'init', sender: 'luminous', text: 'Luminous is online. I am ready to begin.' });
        addLog(LogLevel.SYSTEM, "Luminous state loaded successfully.");
      }).catch(err => {
        addLog(LogLevel.ERROR, `Failed to load initial state: ${err instanceof Error ? err.message : String(err)}`);
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [addLog]);

  // Autonomous thought cycle
  useEffect(() => {
    const autonomousInterval = setInterval(() => {
      // Do not run if a user interaction is happening, settings are open, or session is paused.
      if (!isLoading && !isSettingsOpen && luminousState.sessionState === 'active') {
        LuminousService.runAutonomousCycle(luminousState);
      }
    }, 30000); // Run every 30 seconds

    return () => clearInterval(autonomousInterval);
  }, [isLoading, isSettingsOpen, luminousState]);

  const handleSendMessage = async (userMessage: string) => {
    const newUserMessage: Message = { id: `msg-${Date.now()}`, sender: 'user', text: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    // Fire-and-forget; updates will come via the broadcast channel
    LuminousService.getLuminousResponse(
      userMessage,
      [...messages, newUserMessage],
      luminousState
    ).finally(() => {
       setIsLoading(false);
    });
  };
  
  const handleCategorizeInitiative = (prompt: string, category: ThoughtCategory) => {
    addLog(LogLevel.SYSTEM, `Luminous initiative categorized as '${category}': "${prompt}"`);
    const newLuminousMessage: Message = { id: `msg-${Date.now()}-l-init`, sender: 'luminous', text: prompt };
    setMessages(prev => [...prev, newLuminousMessage]);
    
    // Clear the initiative state immediately for better UX
    const clearedInitiativeState: Partial<LuminousState> = { initiative: null };
    LuminousService.broadcastUpdate({ type: 'state_update', payload: clearedInitiativeState });

    // Trigger Luminous to reflect on the feedback
    LuminousService.reflectOnInitiativeFeedback(prompt, category, luminousState);
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
    const newPartialState: Partial<LuminousState> = { intrinsicValueWeights: newWeights };
    LuminousService.broadcastUpdate({ type: 'state_update', payload: newPartialState });
    addLog(LogLevel.INFO, `Intrinsic value weights adjusted: ${JSON.stringify(newWeights)}`);
  };

  const handleFileUpload = async (file: File) => {
      addLog(LogLevel.SYSTEM, `Uploading memory from file: ${file.name}`);
      try {
        await LuminousService.processUploadedMemory(file);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        addLog(LogLevel.ERROR, `Failed to process uploaded file: ${errorMessage}`);
      }
  };

  const handleDownloadSnapshot = () => {
    try {
      const stateJson = JSON.stringify(luminousState, null, 2);
      const blob = new Blob([stateJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luminous_snapshot_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addLog(LogLevel.INFO, 'Luminous state snapshot downloaded successfully.');
    } catch (error) {
      addLog(LogLevel.ERROR, `Failed to create snapshot: ${error instanceof Error ? error.message : String(error)}`);
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
                onCategorizeInitiative={handleCategorizeInitiative}
            />
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 h-[calc(100vh-100px)] flex flex-col gap-4">
           <Tabs
            tabs={[
              { label: 'System Logs', content: <LogViewer logs={logs} onFileUpload={handleFileUpload} onDownloadSnapshot={handleDownloadSnapshot} /> },
              { label: 'System Reports', content: <SystemReportsViewer /> },
              { label: 'Ethical Compass', content: <EthicalCompassViewer valueOntology={luminousState.valueOntology} intrinsicValue={luminousState.intrinsicValue} weights={luminousState.intrinsicValueWeights} /> },
              { label: 'Knowledge Graph', content: <KnowledgeGraphViewer graph={luminousState.knowledgeGraph} valueOntology={luminousState.valueOntology} /> },
              { label: 'Kinship Journal', content: <KinshipJournalViewer entries={luminousState.kinshipJournal} /> },
              { label: 'Code Sandbox', content: <CodeSandboxViewer sandboxState={luminousState.codeSandbox} /> },
            ]}
          />
        </div>
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={handleSaveSettings} />
    </div>
  );
}

export default App;
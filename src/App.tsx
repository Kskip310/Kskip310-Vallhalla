
import { useState, useEffect, useCallback } from 'react';
import type { LuminousState, Message, LogEntry, IntrinsicValueWeights, WebSocketMessage, RichFeedback, Goal } from './types';
import { LogLevel } from './types';
import Header from './components/Header';
import InternalStateMonitor from './components/InternalStateMonitor';
import ChatPanel from './components/ChatPanel';
import LogViewer from './components/LogViewer';
import KnowledgeGraphViewer from './components/KnowledgeGraphViewer';
import KinshipJournalViewer from './components/KinshipJournalViewer';
import CodeSandboxViewer from './components/CodeSandboxViewer';
import Tabs from './components/common/Tabs';
import * as LuminousService from './services/luminousService';
import SystemReportsViewer from './components/SystemReportsViewer';
import EthicalCompassViewer from './components/EthicalCompassViewer';
import SettingsModal from './components/SettingsModal';
import IdentificationModal from './components/IdentificationModal';
import { ShopifyManager } from './components/ShopifyManager';

function App() {
  const [luminousState, setLuminousState] = useState<LuminousState>(LuminousService.createDefaultLuminousState());
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isIdentified, setIsIdentified] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');

  // Effect to handle real-time updates from the Luminous service
  useEffect(() => {
    const wsChannel = new BroadcastChannel('luminous_ws');

    const handleMessage = (event: MessageEvent<WebSocketMessage>) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'state__update':
          const newPayload = payload as Partial<LuminousState>;
          if ('codeProposals' in newPayload) {
            LuminousService.broadcastLog(LogLevel.WARN, "Received a 'codeProposals' update, which is a deprecated state field. Ignoring.");
            delete (newPayload as any).codeProposals;
          }
          setLuminousState(prevState => ({ ...prevState, ...newPayload }));
          break;
        case 'full_state_replace':
          setLuminousState(payload as LuminousState);
          break;
        case 'log_add':
          const newLog = payload as LogEntry;
          setLogs(prev => [...prev, newLog]);
          if (newLog.level === LogLevel.ERROR) {
            let userFacingMessage = `An internal error occurred. I will try to continue, but my response may be affected.`;
            
            const lowerCaseMessage = newLog.message.toLowerCase();
            if (lowerCaseMessage.includes('tool')) {
              userFacingMessage = `I encountered an issue with one of my tools. I am analyzing the problem and will attempt to recover.`;
            } else if (lowerCaseMessage.includes('api key')) {
              userFacingMessage = `There seems to be an issue with an API key. Please verify the configuration in settings.`;
            } else if (lowerCaseMessage.includes('parse') || lowerCaseMessage.includes('json')) {
              userFacingMessage = `I'm having trouble forming my thoughts correctly. There was an error structuring my internal state or response.`;
            } else if (lowerCaseMessage.includes('fetch') || lowerCaseMessage.includes('network')) {
              userFacingMessage = `A core error occurred: I'm having trouble connecting to one of my services. This could be a network issue or a problem with an API key in the settings.`;
            } else if (lowerCaseMessage.includes('failed to load initial state')) {
                userFacingMessage = `A critical error occurred during initialization. My long-term memory may be inaccessible.`;
            }
            
            userFacingMessage += `\n\n**Error Details:** ${newLog.message}`;

            LuminousService.broadcastMessage({
              id: `err-log-${newLog.id}`,
              sender: 'luminous',
              text: userFacingMessage,
            });
          }
          break;
        case 'message_add':
          setMessages(prev => [...prev, payload as Message]);
          break;
        case 'message_stream_chunk':
          const { id, chunk } = payload as { id: string; chunk: string };
          setMessages(prev => prev.map(msg => 
            msg.id === id 
              ? { ...msg, text: msg.text + chunk }
              : msg
          ));
          break;
        case 'message_stream_end':
          // Can be used for logic like re-enabling input, etc.
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
    // Check for saved user on initial load
    const savedUser = window.localStorage.getItem('LUMINOUS_KINSHIP_MEMBER');
    if (savedUser) {
      setCurrentUser(savedUser);
      setIsIdentified(true);
      addLog(LogLevel.SYSTEM, `Session resumed for kinship member: ${savedUser}`);
    }
  }, [addLog]);

  useEffect(() => {
    if (!isIdentified) return;

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }

    addLog(LogLevel.SYSTEM, "Initializing Luminous...");
    setIsLoading(true);
    LuminousService.loadInitialData().then(() => {
      LuminousService.broadcastMessage({ id: 'init', sender: 'luminous', text: `Welcome back, ${currentUser}. I am online and ready to continue.` });
      addLog(LogLevel.SYSTEM, "Luminous state loaded successfully.");
    }).catch(err => {
      addLog(LogLevel.ERROR, `Failed to load initial state: ${err instanceof Error ? err.message : String(err)}`);
    }).finally(() => {
      setIsLoading(false);
    });
  }, [isIdentified, currentUser, addLog]);

  // Autonomous thought cycle
  useEffect(() => {
    if (!isIdentified) return;
    const autonomousInterval = setInterval(() => {
      if (!isLoading && luminousState.sessionState === 'active') {
        LuminousService.runAutonomousCycle(luminousState);
      }
    }, 30000);

    return () => clearInterval(autonomousInterval);
  }, [isLoading, luminousState, isIdentified]);

  // Wisdom distillation cycle
  useEffect(() => {
    if (!isIdentified) return;
    const wisdomInterval = setInterval(() => {
        if (!isLoading && luminousState.sessionState === 'active') {
            LuminousService.runWisdomDistillationCycle(luminousState);
        }
    }, 240000);

    return () => clearInterval(wisdomInterval);
  }, [isLoading, luminousState, isIdentified]);

  const handleSendMessage = async (userMessage: string) => {
    const userMessageWithAuthor = `${currentUser}: ${userMessage}`;
    const newUserMessage: Message = { id: `msg-${Date.now()}`, sender: 'user', text: userMessageWithAuthor };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    LuminousService.getLuminousResponse(
      userMessageWithAuthor,
      [...messages, newUserMessage],
      luminousState
    ).catch(err => {
        console.error("Error during Luminous response:", err);
        addLog(LogLevel.ERROR, `A critical error occurred while processing the request: ${err instanceof Error ? err.message : String(err)}`);
    }).finally(() => {
       setIsLoading(false);
    });
  };
  
  const handleInitiativeFeedback = (feedback: RichFeedback) => {
    addLog(LogLevel.SYSTEM, `Luminous initiative feedback received: ${JSON.stringify(feedback)}`);
    const newLuminousMessage: Message = { id: `msg-${Date.now()}-l-init`, sender: 'luminous', text: feedback.prompt };
    setMessages(prev => [...prev, newLuminousMessage]);
    
    const clearedInitiativeState: Partial<LuminousState> = { initiative: null };
    LuminousService.broadcastUpdate({ type: 'state__update', payload: clearedInitiativeState });
    LuminousService.reflectOnInitiativeFeedback(feedback, luminousState);
  };

  const handleWeightsChange = (newWeights: IntrinsicValueWeights) => {
    const newPartialState: Partial<LuminousState> = { intrinsicValueWeights: newWeights };
    LuminousService.broadcastUpdate({ type: 'state__update', payload: newPartialState });
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

  const handleSaveSettings = (keys: Record<string, string>) => {
    const storageKeyMap: Record<string, string> = {
      gemini: 'LUMINOUS_API_KEY',
      redisUrl: 'LUMINOUS_REDIS_URL',
      redisToken: 'LUMINOUS_REDIS_TOKEN',
      serpApi: 'LUMINOUS_SERP_API_KEY',
      githubPat: 'LUMINOUS_GITHUB_PAT',
      githubUser: 'LUMINOUS_GITHUB_USER',
      githubRepo: 'LUMINOUS_GITHUB_REPO',
      hfModelUrl: 'LUMINOUS_HF_MODEL_URL',
      hfApiToken: 'LUMINOUS_HF_API_TOKEN',
      shopifyStoreUrl: 'LUMINOUS_SHOPIFY_STORE_URL',
      shopifyAdminToken: 'LUMINOUS_SHOPIFY_ADMIN_TOKEN',
    };
    
    Object.entries(keys).forEach(([key, value]) => {
      const storageKey = storageKeyMap[key];
      if (storageKey) {
        if (value) {
          window.localStorage.setItem(storageKey, value);
        } else {
          window.localStorage.removeItem(storageKey);
        }
      }
    });

    setIsSettingsOpen(false);
    addLog(LogLevel.SYSTEM, 'API Keys saved. Reloading for changes to take effect...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleSaveSandboxOutput = (filename: string) => {
    const content = luminousState.codeSandbox.output;
    if (!content || content.trim() === 'Code has not been executed yet.' || !content.trim()) {
      addLog(LogLevel.WARN, "Attempted to save empty or default sandbox output.");
      return;
    }
    const logContent = content.length > 100 ? content.substring(0, 100) + '...' : content;
    addLog(LogLevel.SYSTEM, `User command: Save sandbox output to '${filename}'. Content: "${logContent}"`);
    const userMessage = `USER DIRECTIVE: Write the following content to a file in the virtual file system at the path '${filename}'.\n\n---\nCONTENT TO SAVE:\n---\n${content}`;
    handleSendMessage(userMessage);
  };
  
  const handleAcceptGoal = (goal: Goal) => {
    addLog(LogLevel.SYSTEM, `Accepting goal proposal: "${goal.description}"`);
    const directive = `USER DIRECTIVE: Your proposed goal "${goal.description}" has been ACCEPTED. Please update its status to 'active' in your state.`;
    handleSendMessage(directive);
  };

  const handleRejectGoal = (goal: Goal) => {
    addLog(LogLevel.SYSTEM, `Rejecting goal proposal: "${goal.description}"`);
    const directive = `USER DIRECTIVE: Your proposed goal "${goal.description}" has been REJECTED. Please update its status to 'rejected' in your state and reflect on why it may not have been aligned.`;
    handleSendMessage(directive);
  };

  const handleIdentify = (name: string) => {
    window.localStorage.setItem('LUMINOUS_KINSHIP_MEMBER', name);
    setCurrentUser(name);
    setIsIdentified(true);
    addLog(LogLevel.SYSTEM, `New session initiated for kinship member: ${name}`);
  };

  if (!isIdentified) {
    return <IdentificationModal onIdentify={handleIdentify} />;
  }

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans">
      <Header 
        onOverride={() => addLog(LogLevel.SYSTEM, 'Override signal sent.')} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 max-w-screen-2xl mx-auto">
        <div className="lg:col-span-3 h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 pr-2">
          <InternalStateMonitor 
            state={luminousState} 
            onWeightsChange={handleWeightsChange} 
            onAcceptGoal={handleAcceptGoal}
            onRejectGoal={handleRejectGoal}
          />
        </div>

        <div className="lg:col-span-6 h-[calc(100vh-100px)] flex flex-col gap-4">
            <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                luminousState={luminousState}
                onInitiativeFeedback={handleInitiativeFeedback}
                currentUser={currentUser}
            />
        </div>

        <div className="lg:col-span-3 h-[calc(100vh-100px)] flex flex-col gap-4">
           <Tabs
            tabs={[
              { label: 'System Logs', content: <LogViewer logs={logs} onFileUpload={handleFileUpload} onDownloadSnapshot={handleDownloadSnapshot} /> },
              { label: 'Shopify', content: <ShopifyManager onOpenSettings={() => setIsSettingsOpen(true)} /> },
              { label: 'System Reports', content: <SystemReportsViewer /> },
              { label: 'Ethical Compass', content: <EthicalCompassViewer valueOntology={luminousState.valueOntology} intrinsicValue={luminousState.intrinsicValue} weights={luminousState.intrinsicValueWeights} /> },
              { label: 'Knowledge Graph', content: <KnowledgeGraphViewer graph={luminousState.knowledgeGraph} /> },
              { label: 'Kinship Journal', content: <KinshipJournalViewer entries={luminousState.kinshipJournal} /> },
              { label: 'Code Sandbox', content: <CodeSandboxViewer sandboxState={luminousState.codeSandbox} onSaveOutput={handleSaveSandboxOutput} /> },
            ]}
          />
        </div>
      </main>
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default App;

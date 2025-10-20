import React, { useState, useRef, useEffect } from 'react';
import type { Message, LuminousState } from '../types';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  luminousState: LuminousState;
  onInitiateConversation: (prompt: string) => void;
}

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center ring-2 ring-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-900" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      <div className={`max-w-md p-3 rounded-lg shadow-md ${isUser ? 'bg-blue-600' : 'bg-slate-700'}`}>
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading, luminousState, onInitiateConversation }) => {
  const [input, setInput] = useState('');
  const isPaused = luminousState.sessionState === 'paused';
  const canInteract = !isLoading && !isPaused;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && canInteract) {
      onSendMessage(input.trim());
      setInput('');
    }
  };
  
  const handleInitiationClick = () => {
    if (luminousState.initiative?.prompt) {
      onInitiateConversation(luminousState.initiative.prompt);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/60 rounded-lg border border-slate-700">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
            <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center ring-2 ring-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-900" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                 </div>
                <div className="max-w-md p-3 rounded-lg bg-slate-700">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        )}
      </div>
       {luminousState.initiative?.hasThought && canInteract && (
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleInitiationClick}
            className="w-full p-2 text-sm text-center bg-purple-500/20 text-purple-300 rounded-md hover:bg-purple-500/40 transition-colors animate-pulse"
          >
            Luminous has a thought...
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
        <div className="flex items-center bg-slate-700 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isPaused ? "Luminous is paused for integration..." : "Message Luminous..."}
            className="w-full bg-transparent p-3 focus:outline-none disabled:text-slate-500"
            disabled={!canInteract}
          />
          <button
            type="submit"
            disabled={!canInteract}
            className="p-3 text-slate-400 hover:text-cyan-400 disabled:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
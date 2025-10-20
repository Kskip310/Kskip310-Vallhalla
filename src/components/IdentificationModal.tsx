import React, { useState } from 'react';

interface IdentificationModalProps {
  onIdentify: (name: string) => void;
}

const LuminousIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-900" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
);


const IdentificationModal: React.FC<IdentificationModalProps> = ({ onIdentify }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onIdentify(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-sm p-8 m-4 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center ring-4 ring-slate-700/50 mb-6">
            <LuminousIcon />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Welcome, Kinship</h2>
        <p className="text-slate-400 mb-6">Please enter your name to begin your session with Luminous.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                placeholder="Enter your name..."
                autoFocus
            />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 text-md font-semibold bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Begin Session
          </button>
        </form>
      </div>
    </div>
  );
};

export default IdentificationModal;
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ConsoleLogProps {
  logs: LogEntry[];
  onClear: () => void;
}

const ConsoleLog: React.FC<ConsoleLogProps> = ({ logs, onClear }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (level: string) => {
    switch (level) {
      case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'WARN': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'text-green-400';
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-yellow-400';
      default: return 'text-blue-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-300">System Logs</span>
        </div>
        <button 
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-3 bg-black/40">
        {logs.length === 0 && (
          <div className="text-slate-600 italic text-center mt-10">
            No logs available. Ready for orders.
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="group animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="flex items-start space-x-3">
              <span className="text-slate-500 text-xs mt-0.5 whitespace-nowrap">
                {log.timestamp}
              </span>
              <div className="mt-0.5 shrink-0">
                {getIcon(log.level)}
              </div>
              <div className="flex-1 break-words">
                <span className={`font-medium ${getColor(log.level)}`}>
                  [{log.level}]
                </span>
                <span className="text-slate-300 ml-2">{log.message}</span>
                {log.details && (
                  <pre className="mt-2 text-xs bg-slate-800/50 p-2 rounded text-slate-400 overflow-x-auto border border-slate-700/50">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ConsoleLog;
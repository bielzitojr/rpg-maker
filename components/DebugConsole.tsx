
import React, { useEffect, useState, useRef } from 'react';
import { debugLogger, LogEntry } from '../services/debugLogger';
import Modal from './Modal';
import { CopyIcon } from './icons/index';

interface DebugConsoleProps {
  onClose: () => void;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = debugLogger.subscribe(setLogs);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (endRef.current) {
        endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleCopyReport = () => {
    const report = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message} ${l.details ? `\nDetails: ${l.details}` : ''}`).join('\n\n');
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
        case 'error': return 'text-red-400';
        case 'warn': return 'text-yellow-400';
        default: return 'text-green-400';
    }
  };

  return (
    <Modal title="Console de Depuração" onClose={onClose}>
      <div className="flex flex-col h-[60vh]">
        <div className="flex justify-between items-center mb-2 px-2">
            <p className="text-sm text-stone-500 italic">Relatório técnico de execução</p>
            <div className="flex gap-2">
                <button 
                    onClick={() => debugLogger.clear()} 
                    className="text-xs px-3 py-1 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded"
                >
                    Limpar
                </button>
                <button 
                    onClick={handleCopyReport} 
                    className="flex items-center gap-1 text-xs px-3 py-1 bg-blue-800 hover:bg-blue-700 text-blue-100 rounded"
                >
                    <CopyIcon className="w-3 h-3" isCopied={copied} />
                    {copied ? 'Copiado!' : 'Copiar Relatório'}
                </button>
            </div>
        </div>
        <div className="flex-grow bg-black/90 p-4 rounded-md overflow-y-auto font-mono text-xs md:text-sm shadow-inner border border-stone-600">
            {logs.length === 0 ? (
                <div className="text-stone-600 text-center mt-10">O sistema está operando normalmente. Nenhum log registrado.</div>
            ) : (
                logs.map(log => (
                    <div key={log.id} className="mb-2 border-b border-stone-800 pb-1">
                        <span className="text-stone-500">[{log.timestamp}]</span>{' '}
                        <span className={`font-bold ${getTypeColor(log.type)}`}>{log.type.toUpperCase()}</span>:{' '}
                        <span className="text-stone-300">{log.message}</span>
                        {log.details && (
                            <pre className="mt-1 ml-4 text-xs text-stone-500 whitespace-pre-wrap overflow-x-hidden">{log.details}</pre>
                        )}
                    </div>
                ))
            )}
            <div ref={endRef} />
        </div>
        <div className="mt-2 text-xs text-stone-500">
            * Se você encontrar erros persistentes, copie este relatório e envie para o desenvolvedor.
        </div>
      </div>
    </Modal>
  );
};

export default DebugConsole;

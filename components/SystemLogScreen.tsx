import React from 'react';
import Modal from './Modal';

interface SystemLogScreenProps {
  logs: string[];
  onClose: () => void;
}

const SystemLogScreen: React.FC<SystemLogScreenProps> = ({ logs, onClose }) => {
  return (
    <Modal title="Registro do Sistema" onClose={onClose}>
      {logs.length === 0 ? (
        <p className="text-stone-500 text-center italic">Nenhum evento registrado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {logs.slice().reverse().map((log, index) => (
            <li key={index} className="p-2 bg-stone-200/50 rounded-lg text-stone-700">
              <span className="text-sm">{log}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default SystemLogScreen;

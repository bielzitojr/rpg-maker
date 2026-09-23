import React from 'react';
import Modal from './Modal';

interface MapScreenProps {
  onClose: () => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ onClose }) => {
  return (
    <Modal title="Mapa" onClose={onClose}>
      <div className="text-center text-stone-500 italic p-8">
        <p>A funcionalidade do mapa ainda não foi implementada.</p>
        <p>Continue explorando para descobrir os segredos que este mundo guarda!</p>
      </div>
    </Modal>
  );
};

export default MapScreen;

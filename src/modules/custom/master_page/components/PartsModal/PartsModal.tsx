import React from 'react';

interface PartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  palletId: number | null;
}

const PartsModal: React.FC<PartsModalProps> = ({ isOpen, onClose, palletId }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h3>Модальное окно с деталями</h3>
        <p>Заглушка для будущего функционала</p>
        <button onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
};

export default PartsModal;

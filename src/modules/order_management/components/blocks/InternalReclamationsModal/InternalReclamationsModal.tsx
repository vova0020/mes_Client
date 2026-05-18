import React, { useState, useEffect, lazy, Suspense } from 'react';
import styles from './InternalReclamationsModal.module.css';

// Ленивая загрузка компонента для оптимизации
const InternalReclamations = lazy(() => import('./InternalReclamations'));

interface InternalReclamationsModalProps {
  onClose: () => void;
}

const InternalReclamationsModal: React.FC<InternalReclamationsModalProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  };

  return (
    <div
      className={`${styles.modalOverlay} ${isVisible ? styles.visible : ''}`}
      onClick={handleClose}
    >
      <div
        className={`${styles.modalContent} ${isVisible ? styles.slideIn : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>📋 Журнал внутренних рекламаций</h3>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          <Suspense fallback={
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              color: '#cbd5e0',
              fontSize: '16px'
            }}>
              ⏳ Загрузка...
            </div>
          }>
            <InternalReclamations onClose={handleClose} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default InternalReclamationsModal;

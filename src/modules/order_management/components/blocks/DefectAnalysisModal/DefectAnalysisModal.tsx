import React, { useState, useEffect, lazy, Suspense } from 'react';
import styles from './DefectAnalysisModal.module.css';

// Ленивая загрузка компонентов для оптимизации
const DefectAnalysis = lazy(() => import('./DefectAnalysis'));
const ProductionReport = lazy(() => import('./ProductionReport'));

type ActiveTab = 'defects' | 'production';

interface DefectAnalysisModalProps {
  onClose: () => void;
}

const DefectAnalysisModal: React.FC<DefectAnalysisModalProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('defects');

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
          <h3>📊 История обработки</h3>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        <div className={styles.tabsBar}>
          <button
            className={`${styles.tab} ${activeTab === 'defects' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('defects')}
          >
            🔴 Анализ брака
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'production' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('production')}
          >
            🟢 Учёт выпуска продукции
          </button>
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
            {activeTab === 'defects' && <DefectAnalysis key="defects" onClose={handleClose} />}
            {activeTab === 'production' && <ProductionReport key="production" onClose={handleClose} />}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default DefectAnalysisModal;

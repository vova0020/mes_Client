import React, { useState } from 'react';
import styles from './StreamsManagement.module.css';
import StreamMachinesCards from './components/StreamMachinesCards/StreamMachinesCards';

interface Stream {
  id: number;
  name: string;
  description: string;
}

interface Stage {
  id: number;
  name: string;
  totalVolume: number;
  readyVolume: number;
  activeWorkers: number;
  totalWorkers: number;
  percentage: number;
}

const StreamsManagement: React.FC = () => {
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const [showMachines, setShowMachines] = useState(false);

  // Тестовые данные потоков
  const streams: Stream[] = [
    { id: 1, name: 'Поток 1', description: 'Первый поток производства' },
    { id: 2, name: 'Поток 2', description: 'Второй поток производства' },
    { id: 3, name: 'Поток 3', description: 'Третий поток производства' }
  ];

  // Тестовые данные этапов
  const stages: Stage[] = [
    {
      id: 1,
      name: 'Название этапа',
      totalVolume: 123456,
      readyVolume: 1234,
      activeWorkers: 3,
      totalWorkers: 5,
      percentage: 35
    },
    {
      id: 2,
      name: 'Второй этап',
      totalVolume: 98765,
      readyVolume: 4567,
      activeWorkers: 2,
      totalWorkers: 4,
      percentage: 67

    },
    {
      id: 3,
      name: 'Второй этап',
      totalVolume: 98765,
      readyVolume: 4567,
      activeWorkers: 2,
      totalWorkers: 4,
      percentage: 67

    },
    {
      id: 4,
      name: 'Второй этап',
      totalVolume: 98765,
      readyVolume: 4567,
      activeWorkers: 2,
      totalWorkers: 4,
      percentage: 67

    },
    {
      id: 5,
      name: 'Второй этап',
      totalVolume: 98765,
      readyVolume: 4567,
      activeWorkers: 2,
      totalWorkers: 4,
      percentage: 67

    },
    {
      id: 6,
      name: 'Второй этап',
      totalVolume: 98765,
      readyVolume: 4567,
      activeWorkers: 2,
      totalWorkers: 4,
      percentage: 67

    },
    {
      id: 7,
      name: 'Третий этап',
      totalVolume: 98765,
      readyVolume: 4567,
      activeWorkers: 2,
      totalWorkers: 4,
      percentage: 93

    }
  ];

  const selectedStream = streams.find(s => s.id === selectedStreamId);

  const handleShowMachines = () => {
    setShowMachines(true);
  };

  const handleCloseMachines = () => {
    setShowMachines(false);
  };

  if (showMachines) {
    return (
      <div className={styles.machinesContainer}>
        <div className={styles.machinesHeader}>
          <button className={styles.backButton} onClick={handleCloseMachines}>
            ← Назад к этапам
          </button>
          <h2>Рабочие места</h2>
        </div>
        <StreamMachinesCards />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>ПОТОК</h1>
        <h1>ЭТАПЫ</h1>
      </div>
      
      <div className={styles.content}>
        {/* Левая панель - список потоков */}
        <div className={styles.streamsPanel}>
          {streams.map(stream => (
            <div
              key={stream.id}
              className={`${styles.streamCard} ${selectedStreamId === stream.id ? styles.selected : ''}`}
              onClick={() => setSelectedStreamId(stream.id)}
            >
              <h3>{stream.name}</h3>
              <p>{stream.description}</p>
            </div>
          ))}
        </div>

        {/* Правая панель - этапы выбранного потока */}
        <div className={styles.stagesPanel}>
          {selectedStream ? (
            <>
              <div className={styles.streamInfo}>
                <h2>{selectedStream.name}</h2>
                <p>{selectedStream.description}</p>
              </div>
              
              <div className={styles.stagesGrid}>
                {stages.map(stage => (
                  <div key={stage.id} className={`${styles.stageCard} ${stage.percentage >= 80 ? styles.highProgress : stage.percentage >= 50 ? styles.mediumProgress : styles.lowProgress}`}>
                    <div className={styles.stageHeader}>
                      <h3>{stage.name}</h3>
                      <div className={`${styles.statusBadge} ${stage.percentage >= 80 ? styles.statusHigh : stage.percentage >= 50 ? styles.statusMedium : styles.statusLow}`}>
                        {stage.percentage >= 80 ? 'Отлично' : stage.percentage >= 50 ? 'Норма' : 'Низкий'}
                      </div>
                    </div>
                    
                    <div className={styles.stageContent}>
                      <div className={styles.volumeInfo}>
                        <div className={styles.volumeRow}>
                          <span className={styles.label}>Норма смены:</span>
                          <span className={styles.value}>{stage.totalVolume.toLocaleString()}</span>
                          <span className={styles.unit}>м²</span>
                        </div>
                        <div className={styles.volumeRow}>
                          <span className={styles.label}>Готово:</span>
                          <span className={`${styles.value} ${styles.ready}`}>{stage.readyVolume.toLocaleString()}</span>
                          <span className={styles.unit}>м²</span>
                        </div>
                        <div className={styles.volumeRow}>
                          <span className={styles.label}>Рабочие места:</span>
                          <span className={`${styles.value} ${stage.activeWorkers === stage.totalWorkers ? styles.full : styles.partial}`}>
                            {stage.activeWorkers}/{stage.totalWorkers}
                          </span>
                          <span className={styles.unit}>акт.</span>
                        </div>
                      </div>
                      
                      <div className={styles.progressSection}>
                        <div className={styles.progressHeader}>
                          <span className={styles.progressLabel}>Выполнение нормы</span>
                          <span className={`${styles.progressValue} ${stage.percentage >= 80 ? styles.highValue : stage.percentage >= 50 ? styles.mediumValue : styles.lowValue}`}>
                            {stage.percentage}%
                          </span>
                        </div>
                        <div className={styles.progressBar}>
                          <div 
                            className={`${styles.progressFill} ${stage.percentage >= 80 ? styles.fillHigh : stage.percentage >= 50 ? styles.fillMedium : styles.fillLow}`}
                            style={{ width: `${stage.percentage}%` }}
                          />
                        </div>
                      </div>
                      
                      <button 
                        className={styles.showWorkplacesButton}
                        onClick={handleShowMachines}
                      >
                        📊 Рабочие места
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <p>Выберите поток для просмотра этапов</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamsManagement;
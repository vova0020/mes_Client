import React, { useState } from 'react';
import styles from './StreamsManagement.module.css';
import StreamMachinesCards from './components/StreamMachinesCards/StreamMachinesCards';
import { useStreams, useStages } from '../../../../hooks/workMonitorHook';

const StreamsManagement: React.FC = () => {
  const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [showMachines, setShowMachines] = useState(false);

  const { streams, loading: streamsLoading } = useStreams();
  const { stages, loading: stagesLoading } = useStages(selectedStreamId);

  const selectedStream = streams.find((s: any) => s.streamId === selectedStreamId);

  const handleShowMachines = (stageId: number) => {
    setSelectedStageId(stageId);
    setShowMachines(true);
  };

  const handleCloseMachines = () => {
    setShowMachines(false);
  };

  if (showMachines && selectedStreamId && selectedStageId) {
    return (
      <div className={styles.machinesContainer}>
        <div className={styles.machinesHeader}>
          <button className={styles.backButton} onClick={handleCloseMachines}>
            ← Назад к этапам
          </button>
          <h2>Рабочие места</h2>
        </div>
        <StreamMachinesCards streamId={selectedStreamId} stageId={selectedStageId} />
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
          {streamsLoading ? (
            <div>Загрузка потоков...</div>
          ) : (
            streams.map((stream: any) => (
              <div
                key={stream.streamId}
                className={`${styles.streamCard} ${selectedStreamId === stream.streamId ? styles.selected : ''}`}
                onClick={() => setSelectedStreamId(stream.streamId)}
              >
                <h3>{stream.streamName}</h3>
              </div>
            ))
          )}
        </div>

        {/* Правая панель - этапы выбранного потока */}
        <div className={styles.stagesPanel}>
          {selectedStream ? (
            <>
              <div className={styles.streamInfo}>
                <h2>{selectedStream.streamName}</h2>
              </div>
              
              <div className={styles.stagesGrid}>
                {stagesLoading ? (
                  <div>Загрузка этапов...</div>
                ) : (
                  stages.map((stage: any) => {
                    const percentage = stage.shiftNorm > 0 ? Math.round((stage.completed / stage.shiftNorm) * 100) : 0;
                    return (
                      <div key={stage.stageId} className={`${styles.stageCard} ${percentage >= 80 ? styles.highProgress : percentage >= 50 ? styles.mediumProgress : styles.lowProgress}`}>
                        <div className={styles.stageHeader}>
                          <h3>{stage.stageName}</h3>
                          <div className={`${styles.statusBadge} ${percentage >= 80 ? styles.statusHigh : percentage >= 50 ? styles.statusMedium : styles.statusLow}`}>
                            {percentage >= 80 ? 'Отлично' : percentage >= 50 ? 'Норма' : 'Низкий'}
                          </div>
                        </div>
                        
                        <div className={styles.stageContent}>
                          <div className={styles.volumeInfo}>
                            <div className={styles.volumeRow}>
                              <span className={styles.label}>Норма смены:</span>
                              <span className={styles.value}>{stage.shiftNorm.toLocaleString()}</span>
                              <span className={styles.unit}>м²</span>
                            </div>
                            <div className={styles.volumeRow}>
                              <span className={styles.label}>Готово:</span>
                              <span className={styles.value}>{stage.completed.toLocaleString()}</span>
                              <span className={styles.unit}>м²</span>
                            </div>
                            <div className={styles.volumeRow}>
                              <span className={styles.label}>Рабочие места:</span>
                              <span className={styles.value}>
                                {stage.workplaceCount}
                              </span>
                              <span className={styles.unit}>шт.</span>
                            </div>
                          </div>
                          
                          <div className={styles.progressSection}>
                            <div className={styles.progressHeader}>
                              <span className={styles.progressLabel}>Выполнение нормы</span>
                              <span className={`${styles.progressValue} ${percentage >= 80 ? styles.highValue : percentage >= 50 ? styles.mediumValue : styles.lowValue}`}>
                                {percentage}%
                              </span>
                            </div>
                            <div className={styles.progressBar}>
                              <div 
                                className={`${styles.progressFill} ${percentage >= 80 ? styles.fillHigh : percentage >= 50 ? styles.fillMedium : styles.fillLow}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          
                          <button 
                            className={styles.showWorkplacesButton}
                            onClick={() => handleShowMachines(stage.stageId)}
                          >
                            📊 Рабочие места
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
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
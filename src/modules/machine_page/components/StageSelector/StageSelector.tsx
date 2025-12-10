import React, { useState, useEffect } from 'react';
import styles from './StageSelector.module.css';

interface Stage {
  id: number;
  name: string;
  finalStage: boolean;
}

interface StageSelectorProps {
  stages: Stage[];
  onStageSelect: (stageId: number) => void;
}

const StageSelector: React.FC<StageSelectorProps> = ({ stages, onStageSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

  useEffect(() => {
    const savedStageId = localStorage.getItem('selectedMachineStageId');
    if (savedStageId) {
      const stage = stages.find(s => s.id === Number(savedStageId));
      if (stage) {
        setSelectedStage(stage);
      } else if (stages.length > 0) {
        setSelectedStage(stages[0]);
        localStorage.setItem('selectedMachineStageId', String(stages[0].id));
      }
    } else if (stages.length > 0) {
      setSelectedStage(stages[0]);
      localStorage.setItem('selectedMachineStageId', String(stages[0].id));
    }
  }, [stages]);

  const handleStageSelect = (stage: Stage) => {
    setSelectedStage(stage);
    localStorage.setItem('selectedMachineStageId', String(stage.id));
    setIsDropdownOpen(false);
    onStageSelect(stage.id);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.stageSelector}`)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className={styles.stageSelector}>
      <button 
        className={styles.navButton}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        {selectedStage?.name || 'Выберите этап'}
        <span className={`${styles.arrow} ${isDropdownOpen ? styles.arrowUp : styles.arrowDown}`}>
          ▼
        </span>
      </button>
      
      {isDropdownOpen && (
        <div className={styles.dropdown}>
          {[...stages].sort((a, b) => a.id - b.id).map((stage) => (
            <button
              key={stage.id}
              className={`${styles.dropdownItem} ${selectedStage?.id === stage.id ? styles.active : ''}`}
              onClick={() => handleStageSelect(stage)}
            >
              <span className={styles.stageName}>{stage.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StageSelector;

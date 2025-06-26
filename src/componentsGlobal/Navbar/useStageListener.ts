import { useState, useEffect } from 'react';
import { NavbarService, type Stage } from '../../modules/api/navbarApi';

/**
 * Хук для отслеживания изменений выбранного этапа
 */
export const useStageListener = () => {
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);

  useEffect(() => {
    // Загружаем текущий этап при монтировании
    const stage = NavbarService.getSelectedStage();
    setCurrentStage(stage);

    // Подписываемся на изменения этапа
    const handleStageChange = (event: CustomEvent) => {
      const newStage = event.detail as Stage;
      setCurrentStage(newStage);
      console.log('Этап изменен:', newStage);
    };

    window.addEventListener('stageChanged', handleStageChange as EventListener);

    return () => {
      window.removeEventListener('stageChanged', handleStageChange as EventListener);
    };
  }, []);

  return currentStage;
};

export default useStageListener;
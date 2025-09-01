import { useCallback } from 'react';
import { startPackingTask, completePackingTask } from '../../api/ypakMachine/packingTaskService';

/**
 * Хук для работы с заданиями упаковки
 */
export const usePackingTasks = () => {
  // Функция для запуска работы над заданием упаковки
  const startPackingWork = useCallback(async (taskId: number, machineId: number): Promise<boolean> => {
    try {
      await startPackingTask(taskId, machineId);
      return true;
    } catch (err) {
      console.error(`Ошибка при запуске задания упаковки ${taskId}:`, err);
      return false;
    }
  }, []);

  // Функция для завершения работы над заданием упаковки
  const completePackingWork = useCallback(async (taskId: number, machineId: number): Promise<boolean> => {
    try {
      await completePackingTask(taskId, machineId);
      return true;
    } catch (err) {
      console.error(`Ошибка при завершении задания упаковки ${taskId}:`, err);
      return false;
    }
  }, []);

  return {
    startPackingWork,
    completePackingWork
  };
};
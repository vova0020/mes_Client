import axios from 'axios';
import { API_URL } from '../config';

/**
 * Обновляет статус задания упаковки на "В работе"
 * @param taskId ID задания
 * @param machineId ID станка
 * @returns Сообщение об успешном обновлении
 */
export const startPackingTask = async (taskId: number, machineId: number): Promise<{ message: string }> => {
  try {
    const response = await axios.put<{ message: string }>(
      `${API_URL}/packing-task-management/${taskId}/start`,
      {
        machineId
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при запуске задания упаковки ${taskId}:`, error);
    throw error;
  }
};

/**
 * Обновляет статус задания упаковки на "Завершено"
 * @param taskId ID задания
 * @param machineId ID станка
 * @returns Сообщение об успешном обновлении
 */
export const completePackingTask = async (taskId: number, machineId: number): Promise<{ message: string }> => {
  try {
    const response = await axios.put<{ message: string }>(
      `${API_URL}/packing-task-management/${taskId}/complete`,
      {
        machineId
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при завершении задания упаковки ${taskId}:`, error);
    throw error;
  }
};
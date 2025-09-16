import axios from 'axios';
import { API_URL } from '../config';

// Типы данных для API станков
export interface Machine {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'BROKEN';
  recommendedLoad?: number;
  noShiftAssignment?: boolean;
  segmentId: number | null;
  segmentName: string | null;
  completionPercentage?: number;
  completedQuantity?: number;
}

// Тип для статусов станка
export type MachineStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'BROKEN';

// Интерфейс для данных из localStorage
export interface LocalMachineData {
  machines: Machine[];
}

/**
 * Функция для получения ID станка и ID участка из localStorage
 * @returns Объект с ID станка и ID участка или null, если данные не найдены
 */
export const getLocalMachineIds = (): { machineId: number; segmentId: number | null } | null => {
  try {
    const assignmentsData = localStorage.getItem('assignments');
    if (!assignmentsData) return null;
    
    const data = JSON.parse(assignmentsData) as LocalMachineData;
    
    if (!data.machines || !data.machines.length) return null;
    
    const firstMachine = data.machines[0];
    return {
      machineId: firstMachine.id,
      segmentId: firstMachine.segmentId
    };
  } catch (error) {
    console.error('Ошибка при получении данных из localStorage:', error);
    return null;
  }
};

/**
 * Сервис для работы с API станков
 */
export const machineApi = {
  /**
   * Получение информации о станке по ID
   * @param id - Идентификатор станка
   * @returns Promise с данными о станке
   */
  getMachineById: async (id: number): Promise<Machine> => {
    try {
      console.log(`Запрос данных о станке с ID=${id} из API`);
      const response = await axios.get<Machine>(`${API_URL}/machines-no-shifts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении данных о станке:', error);
      throw error;
    }
  },

  /**
   * Изменение статуса станка
   * @param machineId - ID станка
   * @param status - Новый статус станка
   * @returns Promise с обновленными данными о станке
   */
  changeMachineStatus: async (machineId: number, status: MachineStatus): Promise<Machine> => {
    try {
      console.log(`Изменение статуса станка с ID=${machineId} на ${status}`);
      const response = await axios.patch<Machine>(`${API_URL}/machines-no-shifts/status`, {
        machineId,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при изменении статуса станка:', error);
      throw error;
    }
  }, 
};
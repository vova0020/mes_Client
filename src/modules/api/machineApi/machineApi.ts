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
}

// Тип для статусов станка
export type MachineStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'BROKEN';

// Интерфейс для данных из localStorage
export interface LocalMachineData {
  machines: Machine[];
}

// Интерфейсы для отбраковки деталей
export interface DefectPalletPartsDto {
  palletId: number;
  quantity: number;
  reportedById: number;
  description?: string;
  machineId?: number;
  stageId: number;
}

export interface DefectPartsResponse {
  message: string;
  reclamation: {
    id: number;
    quantity: number;
    description?: string;
    createdAt: string;
  };
  pallet: {
    id: number;
    name: string;
    newQuantity: number;
  };
}

// Интерфейс для распределения деталей
export interface PartDistribution {
  targetPalletId?: number;
  quantity: number;
  palletName?: string;
}

// Интерфейс для запроса перераспределения деталей
export interface RedistributePartsRequest {
  sourcePalletId: number;
  machineId?: number;
  distributions: PartDistribution[];
}

// Интерфейс для ответа перераспределения деталей
export interface RedistributePartsResponse {
  message: string;
  result: {
    sourcePalletDeleted: boolean;
    createdPallets: {
      id: number;
      name: string;
      quantity: number;
    }[];
    updatedPallets: {
      id: number;
      name: string;
      newQuantity: number;
    }[];
  };
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
      // console.log(`Запрос данных о станке с ID=${id} из API`);
      const response = await axios.get<Machine>(`${API_URL}/machins/${id}`);
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
      // console.log(`Изменение статуса станка с ID=${machineId} на ${status}`);
      const response = await axios.patch<Machine>(`${API_URL}/machins/status`, {
        machineId,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при изменении статуса станка:', error);
      throw error;
    }
  },

  /**
   * Отбраковка деталей с поддона
   * @param defectData - Данные для отбраковки
   * @returns Promise с результатом отбраковки
   */
  defectPalletParts: async (defectData: DefectPalletPartsDto): Promise<DefectPartsResponse> => {
    try {
      const response = await axios.post<DefectPartsResponse>(`${API_URL}/machins/pallets/defect-parts`, defectData);
      return response.data;
    } catch (error) {
      console.error('Ошибка при отбраковке деталей:', error);
      throw error;
    }
  },

  /**
   * Перераспределение деталей между поддонами
   * @param redistributeData - Данные для перераспределения
   * @returns Promise с результатом перераспределения
   */
  redistributeParts: async (redistributeData: RedistributePartsRequest): Promise<RedistributePartsResponse> => {
    try {
      const response = await axios.post<RedistributePartsResponse>(`${API_URL}/machins/pallets/redistribute-parts`, redistributeData);
      return response.data;
    } catch (error) {
      console.error('Ошибка при перераспределении деталей:', error);
      throw error;
    }
  },
};
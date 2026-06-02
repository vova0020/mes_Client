import axios from 'axios';
import { API_URL } from '../../config';

export interface Task {
  priority: number;
  order: {
    orderNumber: string;
    orderName: string;
  };
  pallet: string;
  materials: string;
  address: string;
  status: string;
  totalQuantity: number;
  readyToProcess: number;
  completed: number;
  customPalletId: number;
  assignmentId: number;
}

export interface PartDetail {
  partCode: string;
  partName: string;
  material: string;
  size: string;
  substage: string;
  quantity: string;
  status: string;
  assignmentPartId: number;
}

export interface StartPalletResponse {
  status: string;
  message: string;
  assignmentId: number;
  startedAt: string;
  orderStatusChanged?: boolean;
}

export interface CompletePalletResponse {
  status: string;
  message: string;
  assignmentId: number;
  completedAt: string;
}

export interface StartPartResponse {
  status: string;
  message: string;
  assignmentPartId: number;
  palletStatusChanged?: boolean;
  orderStatusChanged?: boolean;
}

export interface CompletePartResponse {
  status: string;
  message: string;
  assignmentPartId: number;
  processedQuantity: number;
  palletCompleted?: boolean;
}

export const machineTasksApi = {
  getTasks: async (machineId: number, stageId: number): Promise<Task[]> => {
    try {
      const response = await axios.get<Task[]>(`${API_URL}/custom/machines/tasks`, {
        params: { machineId, stageId }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении заданий станка:', error);
      throw error;
    }
  },

  getPartDetails: async (customPalletId: number, stageId: number): Promise<PartDetail[]> => {
    try {
      const response = await axios.get<PartDetail[]>(`${API_URL}/custom/machines/tasks/parts`, {
        params: { customPalletId, stageId }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении деталей поддона:', error);
      throw error;
    }
  },

  // Взять поддон в работу
  startPallet: async (assignmentId: number): Promise<StartPalletResponse> => {
    try {
      const response = await axios.post<StartPalletResponse>(
        `${API_URL}/custom/machines/tasks/assignments/${assignmentId}/start`
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при взятии поддона в работу:', error);
      throw error;
    }
  },

  // Завершить работу над поддоном
  completePallet: async (assignmentId: number): Promise<CompletePalletResponse> => {
    try {
      const response = await axios.post<CompletePalletResponse>(
        `${API_URL}/custom/machines/tasks/assignments/${assignmentId}/complete`
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при завершении работы над поддоном:', error);
      throw error;
    }
  },

  // Взять деталь в работу
  startPart: async (assignmentPartId: number): Promise<StartPartResponse> => {
    try {
      const response = await axios.post<StartPartResponse>(
        `${API_URL}/custom/machines/tasks/assignments/parts/${assignmentPartId}/start`
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при взятии детали в работу:', error);
      throw error;
    }
  },

  // Завершить работу над деталью
  completePart: async (assignmentPartId: number, processedQuantity: number): Promise<CompletePartResponse> => {
    try {
      const response = await axios.post<CompletePartResponse>(
        `${API_URL}/custom/machines/tasks/assignments/parts/${assignmentPartId}/complete`,
        { processedQuantity }
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при завершении работы над деталью:', error);
      throw error;
    }
  },
};
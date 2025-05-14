import axios from 'axios';
import { API_URL } from '../config';

// Интерфейсы для типизации данных
export interface YpakOrder {
  id: number;
  runNumber: string;
  name: string;
  progress: number | null;
}

export interface YpakItem {
  id: number;
  article: string | null;
  name: string;
}

export interface YpakTask {
  operationId: number;
  processStepId: number;
  processStepName: string;
  priority: number | null;
  quantity: number;
  status: 'ON_MACHINE' | 'IN_PROGRESS' | 'COMPLETED' | 'BUFFERED' | 'PARTIALLY_COMPLETED';
  totalQuantity: number;
  readyForPackaging: number;
  packaged: number;
  ypak: YpakItem;
  order: YpakOrder;
}

export interface YpakMachineDetails {
  machineId: number;
  machineName: string;
  tasks: YpakTask[];
}

/**
 * Получает ID станка из localStorage
 * @returns ID станка или null, если не удалось получить
 */
const getMachineIdFromStorage = (): number | null => {
  try {
    const assignmentsData = localStorage.getItem('assignments');
    if (!assignmentsData) {
      console.error('Отсутствуют данные assignments в localStorage');
      return null;
    }
    
    const parsedData = JSON.parse(assignmentsData);
    if (!parsedData.machines || parsedData.machines.length === 0) {
      console.error('Нет данных о станках в assignments');
      return null;
    }
    
    return parsedData.machines[0].id;
  } catch (error) {
    console.error('Ошибка при получении machineId из localStorage:', error);
    return null;
  }
};

// Получение задач для станка упаковки
export const getMachineTask = async (): Promise<YpakMachineDetails> => {
  const machineId = getMachineIdFromStorage();
  
  if (machineId === null) {
    console.error('Не удалось получить ID станка из localStorage');
    throw new Error('Не удалось получить ID станка из localStorage');
  }
  
  try {
    const response = await axios.get(`${API_URL}/ypak/machines/${machineId}/task`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении данных о задачах станка упаковки:', error);
    throw error;
  }
};

// Отправка задачи на мониторы
export const sendToMonitors = async (operationId: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/ypak/operations/${operationId}/send-to-monitors`);
  } catch (error) {
    console.error('Ошибка при отправке задачи на мониторы:', error);
    throw error;
  }
};

// Перевод задачи в работу
export const startOperation = async (operationId: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/ypak/operations/${operationId}/start`);
  } catch (error) {
    console.error('Ошибка при переводе задачи в работу:', error);
    throw error;
  }
};

// Завершение задачи
export const completeOperation = async (operationId: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/ypak/operations/${operationId}/complete`);
  } catch (error) {
    console.error('Ошибка при завершении задачи:', error);
    throw error;
  }
};

// Частичное завершение задачи
export const partiallyCompleteOperation = async (operationId: number, packagedCount: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/ypak/operations/${operationId}/partially-complete`, {
      packagedCount
    });
  } catch (error) {
    console.error('Ошибка при частичном завершении задачи:', error);
    throw error;
  }
};

// Получение схемы укладки для упаковки
export const getPackingScheme = async (ypakId: number): Promise<Blob> => {
  try {
    const response = await axios.get(`${API_URL}/ypak/${ypakId}/packing-scheme`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении схемы укладки:', error);
    throw error;
  }
};
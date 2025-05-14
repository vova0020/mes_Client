import axios from 'axios';
import { API_URL } from '../config';

// Интерфейсы для данных
export interface PackagingDataDto {
  id: number;
  article: string;
  name: string;
  totalQuantity: number;
  readyForPackaging: number;
  allocated: number;
  assembled: number;
  packed: number;
  allowPackingOutsideLine: boolean;
  assignedPackager?: string;
}

export interface PackagingWorkerDto {
  id: number;
  name: string;
}

// Функция для получения списка упаковок для заказа
export const fetchPackagingByOrderId = async (orderId: number | null): Promise<PackagingDataDto[]> => {
  if (orderId === null) {
    return [];
  }
  
  try {
    const response = await axios.get(`${API_URL}/ypak/packaging/order/${orderId}`);
    return response.data.map((item: any, index: number) => ({
      id: index + 1, // Временное решение для id, в будущем будет приходить с бэкенда
      article: item.article || 'Н/Д',
      name: item.name,
      totalQuantity: item.totalQuantity,
      readyForPackaging: item.readyForPackaging,
      allocated: item.allocated,
      assembled: item.assembled,
      packed: item.packed,
      allowPackingOutsideLine: false, // По умолчанию выключено
      assignedPackager: undefined
    }));
  } catch (error) {
    console.error('Ошибка при получении данных об упаковках:', error);
    throw error;
  }
};

// Функция для получения схемы укладки
export const fetchPackingScheme = async (packagingId: number): Promise<Blob> => {
  try {
    const response = await axios.get(`${API_URL}/ypak/packaging/${packagingId}/scheme`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении схемы укладки для упаковки ${packagingId}:`, error);
    throw error;
  }
};

// Функция для получения списка сотрудников-упаковщиков
export const fetchPackagingWorkers = async (): Promise<PackagingWorkerDto[]> => {
  try {
    const response = await axios.get(`${API_URL}/ypak/packaging/workers`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка сотрудников-упаковщиков:', error);
    throw error;
  }
};

// Функция для назначения упаковщика
export const assignPackagingWorker = async (packagingId: number, workerId: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/ypak/packaging/${packagingId}/assign-worker`, { workerId });
  } catch (error) {
    console.error(`Ошибка при назначении упаковщика для упаковки ${packagingId}:`, error);
    throw error;
  }
};

// Функция для обновления статуса "Разрешить паковать вне линии"
export const updateAllowPackingOutsideLine = async (packagingId: number, allow: boolean): Promise<void> => {
  try {
    await axios.post(`${API_URL}/ypak/packaging/${packagingId}/allow-outside-packing`, { allow });
  } catch (error) {
    console.error(`Ошибка при обновлении разрешения на упаковку вне ��инии для ${packagingId}:`, error);
    throw error;
  }
};

// Функция для обновления статуса упаковки
export const updatePackagingStatus = async (packagingId: number, status: 'in_progress' | 'completed' | 'partially_completed'): Promise<void> => {
  try {
    await axios.post(`${API_URL}/ypak/packaging/${packagingId}/status`, { status });
  } catch (error) {
    console.error(`Ошибка при обновлении статуса для упаковки ${packagingId}:`, error);
    throw error;
  }
};
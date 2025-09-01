import axios from 'axios';
import { API_URL } from '../config';

// Интерфейсы для данных
export interface PackagingDataDto {
  id: number;
  orderId: number;
  packageCode: string;
  packageName: string;
  totalQuantity: number;
  readyForPackaging: number;
  distributed: number;
  assembled: number;
  completed: number;
  packingStatus: string;
  tasks?: any[];
  allowPackingOutsideLine?: boolean;
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
    const response = await axios.get(`${API_URL}/packaging/by-order/${orderId}`);
    // console.log(response.data);
    
    // Фильтруем данные только для конкретного заказа
    const filteredPackages = response.data.packages.filter((item: any) => 
      item.orderId === orderId
    );
    
    return filteredPackages.map((item: any) => ({
      id: item.id,
      orderId: item.orderId,
      packageCode: item.packageCode || 'Н/Д',
      packageName: item.packageName,
      totalQuantity: item.totalQuantity || 0,
      readyForPackaging: item.readyForPackaging || 0,
      distributed: item.distributed || 0,
      assembled: item.assembled || 0,
      completed: item.completed || 0,
      packingStatus: item.packingStatus || 'NOT_PROCESSED',
      tasks: item.tasks || [],
      allowPackingOutsideLine: false,
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
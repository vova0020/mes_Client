import axios from 'axios';
import { API_URL } from '../config';

// Интерфейсы для типизации данных
export interface YpakOrder {
  orderId: number;
  batchNumber: string;
  orderName: string;
  completionPercentage: number;
  isCompleted: boolean;
  launchPermission: boolean;
}

export interface YpakMachine {
  machineId: number;
  machineName: string;
  status: string;
}

export interface YpakPackage {
  packageId: number;
  packageName: string;
  status: string;
}

export interface YpakProductionPackage {
  packageId: number;
  packageCode: string;
  packageName: string;
  completionPercentage: number;
  quantity: number;
  order: YpakOrder;
}

export interface YpakTask {
  taskId: number;
  packageId: number;
  machineId: number;
  assignedTo: string | null;
  status: 'NOT_PROCESSED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED';
  priority: number;
  assignedAt: string;
  completedAt: string | null;
  assignedQuantity: number;
  completedQuantity: number;
  remainingQuantity: number;
  machine: YpakMachine;
  package: YpakPackage;
  productionPackage: YpakProductionPackage;
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
    const response = await axios.get(`${API_URL}/packing-assignments/by-machine/${machineId}`);
    const tasks: YpakTask[] = response.data;
    
    // Формируем объект с информацией о станке и задачах
    const machineDetails: YpakMachineDetails = {
      machineId: machineId,
      machineName: tasks.length > 0 ? tasks[0].machine.machineName : 'Неизвестный станок',
      tasks: tasks
    };
    
    return machineDetails;
  } catch (error) {
    console.error('Ошибка при получении данных о задачах станка упаковки:', error);
    throw error;
  }
};

// Отправка задачи на мониторы
export const sendToMonitors = async (taskId: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/packing-assignments/${taskId}/send-to-monitors`);
  } catch (error) {
    console.error('Ошибка при отправке задачи на мониторы:', error);
    throw error;
  }
};

// Перевод задачи в работу
export const startOperation = async (taskId: number): Promise<void> => {
  try {
    await axios.put(`${API_URL}/packing-task-management/${taskId}/start`);
  } catch (error) {
    console.error('Ошибка при переводе задачи в работу:', error);
    throw error;
  }
};

// Завершение задачи
export const completeOperation = async (taskId: number): Promise<void> => {
  try {
    await axios.put(`${API_URL}/packing-task-management/${taskId}/complete`);
  } catch (error) {
    console.error('Ошибка при завершении задачи:', error);
    throw error;
  }
};

// Частичное завершение задачи
export const partiallyCompleteOperation = async (taskId: number, packagedCount: number): Promise<void> => {
  try {
    await axios.put(`${API_URL}/packing-task-management/${taskId}/partially-complete`, {
      packagedCount
    });
  } catch (error) {
    console.error('Ошибка при частичном завершении задачи:', error);
    throw error;
  }
};

// Получение схемы укладки для упаковки
export const getPackingScheme = async (packageId: number): Promise<Blob> => {
  try {
    const response = await axios.get(`${API_URL}/packages/${packageId}/packing-scheme`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении схемы укладки:', error);
    throw error;
  }
};

// Интерфейс для ответа API назначения поддона на упаковку
export interface AssignPalletToPackageResponse {
  success: boolean;
  assignmentId: number;
  message: string;
}

// Назначение поддона на упаковку
export const assignPalletToPackage = async (
  palletId: number, 
  packageId: number, 
  quantity: number
): Promise<AssignPalletToPackageResponse> => {
  try {
    const response = await axios.post(`${API_URL}/packaging/pallets/assign-to-package`, {
      palletId,
      packageId,
      quantity
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при назначении поддона на упаковку:', error);
    throw error;
  }
};

// Интерфейс для отбраковки деталей
export interface DefectPartsRequestDto {
  palletId: number;
  quantity: number;
  reportedById: number;
  description?: string;
  machineId?: number;
  stageId: number;
}

// Интерфейс для ответа API при отбраковке деталей
export interface DefectPartsResponseDto {
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

// Функция для отбраковки деталей с поддона
export const defectParts = async (request: DefectPartsRequestDto): Promise<DefectPartsResponseDto> => {
  try {
    const response = await axios.post<DefectPartsResponseDto>(`${API_URL}/packaging/pallets/defect-parts`, request);
    console.log('Детали успешно отбракованы:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при отбраковке деталей:', error);
    throw error;
  }
};

// Интерфейс для возврата деталей
export interface ReturnPartsRequestDto {
  partId: number;
  palletId: number;
  quantity: number;
  returnToStageId: number;
  userId: number;
}

// Интерфейс для ответа API при возврате деталей
export interface ReturnPartsResponseDto {
  message: string;
  returnedPallet: {
    id: number;
    name: string;
    quantity: number;
  };
}

// Функция для возврата деталей в производство
export const returnParts = async (request: ReturnPartsRequestDto): Promise<ReturnPartsResponseDto> => {
  try {
    const response = await axios.post<ReturnPartsResponseDto>(`${API_URL}/packaging/pallets/return-parts`, request);
    console.log('Детали успешно возвращены:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при возврате деталей:', error);
    throw error;
  }
};
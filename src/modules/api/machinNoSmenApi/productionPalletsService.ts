import axios from 'axios';
import { API_URL } from '../config';

// Определение интерфейсов согласно документации API
export interface BufferCellDto {
  id: number;
  code: string;
  // Добавляем поля из реальной структуры данных сервера
  bufferId?: number;
  bufferName?: string;
  // Оставляем старые поля для обратной совместимости
  capacity?: number;
  buffer?: {
    id: number,
    location: string,
    name: string,
  };
  status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
}

export interface MachineDto {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface ProcessStepDto {
  id: number;
  name: string;
  sequence?: number;
}

export interface OperatorDto {
  id: number;
  username: string;
  details?: {
    fullName: string;
  };
}

export interface OperationDto {
  id: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BUFFERED'| 'ON_MACHINE';
  completionStatus?: 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED'| 'BUFFERED'| 'ON_MACHINE';
  startedAt: string;
  completedAt?: string;
  quantity?: number;
  productionPallet?: {
    id: number;
    name: string;
  };
  machine?: {
    id: number;
    name: string;
    status: string;
  };
  processStep?: ProcessStepDto;
  operator?: OperatorDto;
  isCompletedForDetail?: boolean; // Добавлено согласно документации
}

// Определение интерфейса для детали (добавлено для новой структуры данных)
export interface DetailDto {
  id: number;
  article: string;
  name: string;
  material: string;
  size: string;
  totalNumber: number;
  // Другие поля детали, которые могут присутствовать
}

// Определение интерфейса для производственного поддона
export interface ProductionPallet {
  id: number;
  name: string;
  quantity: number;
  detailId: number;
  bufferCell: BufferCellDto | null;
  machine: MachineDto | null;
  currentOperation?: OperationDto | null;
  segmentId?: number;
  
  // Дополнительные поля из реальной структуры данных
  currentStepId?: number;
  currentStepName?: string;
  detail?: DetailDto;
  currentStep?: ProcessStepDto; // Добавлено согласно документации
}

// Интерфейс для ответа API со списком поддонов
export interface PalletsResponseDto {
  pallets: ProductionPallet[];
  total: number;
}

// Интерфейс для ответа API с буферными ячейками
export interface BufferCellsResponseDto {
  cells: BufferCellDto[];
  total: number;
}

// Интерфейс для ответа API со станками
export interface MachinesResponseDto {
  machines: MachineDto[];
  total: number;
}

// Интерфейс для данных пользователя из localStorage
export interface UserData {
  id: number;
  username: string;
  role: string;
  fullName: string;
}

// Интерфейс для данных о станке из localStorage
export interface AssignmentsData {
  machines: {
    id: number;
    name: string;
    status: string;
    segmentId: number;
    segmentName: string;
  }[];
  segments?: {
    id: number;
    name: string;
  }[];
}

// Интерфейс для ответа API при завершении обработки поддона
export interface CompleteProcessingResponseDto {
  operation: OperationDto;
  pallet: ProductionPallet;
  nextStep: string;
}

// Функция для получения данных пользователя из localStorage
export const getUserData = (): UserData | null => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.error('Данные пользователя не найдены в localStorage');
      return null;
    }
    return JSON.parse(userData);
  } catch (error) {
    console.error('Ошибка при получении данных пользователя из localStorage:', error);
    return null;
  }
};

// Функция для получения данных о станке из localStorage
export const getAssignmentsData = (): AssignmentsData | null => {
  try {
    const assignmentsData = localStorage.getItem('assignments');
    if (!assignmentsData) {
      console.error('Данные о станке не найдены в localStorage');
      return null;
    }
    return JSON.parse(assignmentsData);
  } catch (error) {
    console.error('Ошибка при получении данных о станке из localStorage:', error);
    return null;
  }
};

/**
 * Получает ID сегмента из localStorage
 * @returns ID сегмента или null, если не удалось получить
 */
const getSegmentIdFromStorage = (): number | null => {
  try {
    const assignmentsData = localStorage.getItem('assignments');
    if (!assignmentsData) {
      console.error('Отсутствуют данные assignments в localStorage');
      return null;
    }
    
    const parsedData = JSON.parse(assignmentsData);
    if (!parsedData.machines || parsedData.machines.length === 0) {
      console.error('Нет данных assignments отсутствуют segments');
      return null;
    }
    
    return parsedData.machines[0].segmentId;
  } catch (error) {
    console.error('Ошибка при получении segmentId из localStorage:', error);
    return null;
  }
};

// Функция для получения текста статуса операции в удобном для отображения формате
export const getOperationStatusText = (operation?: OperationDto | null): string => {
  // Отладочный вывод
  console.log('getOperationStatusText получил операцию:', operation);
  
  // Проверка наличия операции
  if (!operation) {
    return 'Не в обработке';
  }
  
  // Проверка completionStatus (если есть)
  if (operation.completionStatus) {
    switch (operation.completionStatus) {
      case 'COMPLETED': return 'Готово';
      case 'PARTIALLY_COMPLETED': return 'Выполнено частично';
      case 'ON_MACHINE': return 'Ожидает обработки';
      case 'BUFFERED': return 'В буфере';
      case 'IN_PROGRESS': return 'В работе';
      default: return 'В обработке';
    }
  } 
  
  // Если нет completionStatus, используем status
  if (operation.status) {
    switch (operation.status) {
      case 'IN_PROGRESS': return 'В работе';
      case 'COMPLETED': return 'Готово';
      case 'ON_MACHINE': return 'Ожидает обработки';
      case 'FAILED': return 'Ошибка';
      case 'BUFFERED': return 'В буфере';
      default: return 'Не обрабатывается';
    }
  }
  
  // Если ничего не подошло
  return 'Статус неизвестен';
};

// Функция для получения текста текущего этапа обработки
export const getProcessStepText = (operation?: OperationDto | null): string => {
  if (!operation || !operation.processStep) return 'Нет данных';
  
  const step = operation.processStep;
  return `${step.name}${step.sequence ? ` (этап ${step.sequence})` : ''}`;
};

// Функция для получения производственных поддонов по ID детали
export const fetchProductionPalletsByDetailId = async (detailId: number | null): Promise<ProductionPallet[]> => {
  if (detailId === null) {
    return [];
  }
  const segmentId = getSegmentIdFromStorage();
    
    if (segmentId === null) {
      console.error('Не удалось получить ID сегмента из localStorage');
      throw new Error('Не удалось получить ID сегмента из localStorage');
    }
  try {
    const response = await axios.get<PalletsResponseDto>(`${API_URL}/machines-no-shifts/detail/pallets`,{
      params: {
        detailId: detailId,
        segmentId: segmentId
      }
    });
    console.log('Ответ API fetchProductionPalletsByDetailId:', response.data);
    
    // Обрабатываем данные от API - убеждаемся, что возвращаемый формат корректен
    if (!response.data || !response.data.pallets) {
      console.warn('Некорректный формат ответа API:', response.data);
      
      // Если ответ представляет собой напрямую массив (а не объект с полем pallets)
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    }
    
    // Обрабатываем данные от API - убеждаемся, что currentOperation корректно определен
    const processedPallets = response.data.pallets.map(pallet => {
      // Дополнительная проверка и логирование для отладки
      console.log(`Проверка данных поддона ID=${pallet.id}, имя=${pallet.name}:`, {
        hasCurrentOperation: !!pallet.currentOperation,
        currentOperation: pallet.currentOperation,
        currentStepName: pallet.currentStepName
      });
      
      return pallet;
    });
    
    return processedPallets;
  } catch (error) {
    console.error('Ошибка при получении поддонов детали:', error);
    throw error;
  }
};

// Функция для получения доступных ячеек буфера
export const fetchBufferCellsBySegmentId = async (): Promise<BufferCellDto[]> => {
  try {
    // Получаем segmentId из локального хранилища
    const assignmentsData = getAssignmentsData();
    if (!assignmentsData || !assignmentsData.machines || assignmentsData.machines.length === 0) {
      console.error('Отсутствуют данные о станке или сегменте в localStorage');
      throw new Error('Отсутствуют данные о станке или сегменте в localStorage');
    }
    
    const segmentId = assignmentsData.machines[0].segmentId;
    
    // Формируем URL с обязательным параметром segmentId
    const response = await axios.get(`${API_URL}/buffer/cells?segmentId=${segmentId}`);
    
    // Проверяем формат данных и адаптируем под него
    if (Array.isArray(response.data)) {
      // Если сервер возвращает массив напрямую
      return response.data;
    } else if (response.data.cells && Array.isArray(response.data.cells)) {
      // Если сервер возвращает объект с полем cells
      return response.data.cells;
    } else {
      // Неизвестный формат, возвращаем пустой массив и логируем ошибку
      console.error('Неожиданный формат данных от сервера:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Ошибка при получении ячеек буфера:', error);
    throw error;
  }
};

// Функция для перевода поддона в статус "В работу"
export const startPalletProcessing = async (palletId: number): Promise<OperationDto | null> => {
  try {
    // Получаем данные пользователя из localStorage
    const userData = getUserData();
    if (!userData) {
      throw new Error('Данные пользователя не найдены');
    }
    
    // Получаем данные о станке из localStorage
    const assignmentsData = getAssignmentsData();
    if (!assignmentsData || !assignmentsData.machines || assignmentsData.machines.length === 0) {
      throw new Error('Данные о станке не найдены');
    }
    
    const machine = assignmentsData.machines[0];
    
    // Отправляем запрос на API
    const response = await axios.post(`${API_URL}/pallets/start-processing`, {
      palletId: palletId,
      machineId: machine.id,
      operatorId: userData.id,
    });
    
    console.log(`Поддон ${palletId} успешно переведен в статус "В работу":`, response.data);
    return response.data.operation || null;
  } catch (error) {
    console.error(`Ошибка при переводе поддона ${palletId} в статус "В работу":`, error);
    throw error;
  }
};

// Функция для перевода поддона в статус "Готово"
export const completePalletProcessing = async (palletId: number): Promise<CompleteProcessingResponseDto> => {
  try {
    // Получаем данные пользователя из localStorage
    const userData = getUserData();
    if (!userData) {
      throw new Error('Данные пользователя не найдены');
    }
    
    // Получаем данные о станке из localStorage
    const assignmentsData = getAssignmentsData();
    if (!assignmentsData || !assignmentsData.machines || assignmentsData.machines.length === 0) {
      throw new Error('Данные о станке не найдены');
    }
    
    const machine = assignmentsData.machines[0];
    
    // Создаем объект запроса согласно документации
    const requestData = {
      palletId: palletId,
      machineId: machine.id,
      operatorId: userData.id,
      // segmentId является опциональным, добавляем если доступен
      segmentId: assignmentsData.machines[0].segmentId
    };
    
    // Отправляем запрос на API по новому URL
    const response = await axios.post(`${API_URL}/pallets/complete-processing`, requestData);
    
    console.log(`Поддон ${palletId} успешно переведен в статус "Готово":`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при переводе поддона ${palletId} в статус "Готово":`, error);
    throw error;
  }
};

// Функция для обновления буферной ячейки поддона
export const updateBufferCell = async (palletId: number, bufferCellId: number): Promise<ProductionPallet> => {
  try {
       
    // Отправляем запрос на API
    const response = await axios.post(`${API_URL}/pallets/move-to-buffer`, {
      palletId: palletId,
      bufferCellId: bufferCellId
    });
    
    console.log(`Буферная ячейка для поддона ${palletId} успешно обновлена:`, response.data);
    return response.data.pallet;
  } catch (error) {
    console.error(`Ошибка при обновлении буферной ячейки для поддона ${palletId}:`, error);
    throw error;
  }
};


// Функция для получения маршрутного листа поддона
export const getPalletRouteSheet = async (palletId: number): Promise<Blob> => {
  try {
    const response = await axios.get(`${API_URL}/pallets/${palletId}/route-sheet`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении маршрутного листа поддона:', error);
    throw error;
  }
};

// Функция для получения текущей операции для поддона
export const getCurrentOperation = async (palletId: number): Promise<OperationDto | null> => {
  try {
    const response = await axios.get<{operation: OperationDto | null}>(`${API_URL}/pallets/${palletId}/current-operation`);
    console.log(`Получена операция для поддона ${palletId}:`, response.data);
    return response.data.operation;
  } catch (error) {
    console.error('Ошибка при получении текущей операции поддона:', error);
    return null;
  }
};
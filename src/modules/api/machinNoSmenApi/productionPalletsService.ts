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

// Определение интерфейса для производственного поддона согласно новой API документации
export interface ProductionPallet {
  id: number;
  name: string;
  quantity: number;
  detailId: number;
  bufferCell: BufferCellDto | null;
  machine: MachineDto | null;
  currentOperation: CurrentOperationDto | null;
  segmentId?: number;
  
  // Дополнительные поля из реальной структуры данных
  currentStepId?: number;
  currentStepName?: string;
  detail?: DetailDto;
  currentStep?: ProcessStepDto;
}

// Новый интерфейс для текущей операции согласно API документации
export interface CurrentOperationDto {
  id: number;
  status: TaskStatus;
  startedAt: string;
  completedAt?: string;
  processStep: {
    id: number;
    name: string;
    sequence: number;
  };
  // Добавляем для обратной совместимости
  completionStatus?: 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED'| 'BUFFERED'| 'ON_MACHINE';
  isCompletedForDetail?: boolean;
}

// Enum для статусов задач согласно API документации
export enum TaskStatus {
  NOT_PROCESSED = "NOT_PROCESSED",
  PENDING = "PENDING", 
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED"
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

// Интерфейс для ответа API при завершении обработки поддона (обновлен согласно новой документации)
export interface CompleteProcessingResponseDto {
  message: string;
  assignment: {
    assignmentId: number;
    machineId: number;
    palletId: number;
    assignedAt: string;
    completedAt: string;
    machine: {
      machineId: number;
      machineName: string;
      status: string;
    };
    pallet: {
      palletId: number;
      palletName: string;
      partId: number;
      part: {
        partId: number;
        partName: string;
      };
    };
  };
  nextStage: string;
}

// Интерфейс для ответа API при взятии поддона в работу
export interface TakeToWorkResponseDto {
  message: string;
  assignment: {
    assignmentId: number;
    machineId: number;
    palletId: number;
    assignedAt: string;
    machine: {
      machineId: number;
      machineName: string;
      status: string;
    };
    pallet: {
      palletId: number;
      palletName: string;
      partId: number;
      part: {
        partId: number;
        partName: string;
      };
    };
  };
  operation: {
    id: number;
    status: string;
    startedAt: string;
    processStep: {
      id: number;
      name: string;
    };
  };
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
    const selectedStageData = localStorage.getItem('selectedStage');
    if (!selectedStageData) {
      console.error('Отсутствуют данные selectedStage в localStorage');
      return null;
    }

    const parsedData = JSON.parse(selectedStageData);
    if (!parsedData || parsedData.length === 0) {
      console.error('Нет данных selectedStage отсутствуют stages');
      return null;
    }

    return parsedData.id;
  } catch (error) {
    console.error('Ошибка при получении stageid из localStorage:', error);
    return null;
  }
};

// Функция для получения текста статуса операции в удобном для отображения формате (обновлена для новых статусов)
export const getOperationStatusText = (operation?: CurrentOperationDto | OperationDto | null): string => {
  // Проверка наличия операции
  if (!operation) {
    return 'Не в обработке';
  }
  
  // Работаем с новыми статусами TaskStatus
  if ('status' in operation && typeof operation.status === 'string') {
    switch (operation.status) {
      case TaskStatus.NOT_PROCESSED: return 'Не обработано';
      case TaskStatus.PENDING: return 'Ожидает';
      case TaskStatus.IN_PROGRESS: return 'В работе';
      case TaskStatus.COMPLETED: return 'Готово';
      default: 
        // Обратная совместимость со старыми статусами
        if (operation.status === 'ON_MACHINE') return 'На станке';
        if (operation.status === 'BUFFERED') return 'В буфере';
        if (operation.status === 'FAILED') return 'Ошибка';
        return 'Неизвестный статус';
    }
  }
  
  // Проверка completionStatus для обратной совместимости
  const legacyOperation = operation as OperationDto;
  if (legacyOperation.completionStatus) {
    switch (legacyOperation.completionStatus) {
      case 'COMPLETED': return 'Готово';
      case 'PARTIALLY_COMPLETED': return 'Выполнено частично';
      case 'ON_MACHINE': return 'На станке';
      case 'BUFFERED': return 'В буфере';
      case 'IN_PROGRESS': return 'В работе';
      default: return 'В обработке';
    }
  }
  
  return 'Статус неизвестен';
};

// Функция для получения текста текущего этапа обработки (обновлена для новой структуры)
export const getProcessStepText = (operation?: CurrentOperationDto | OperationDto | null): string => {
  if (!operation) return 'Нет данных';
  
  // Проверяем новую структуру processStep
  if (operation.processStep) {
    const step = operation.processStep;
    return `${step.name}${step.sequence ? ` (этап ${step.sequence})` : ''}`;
  }
  
  return 'Нет данных';
};

// Функция для получения доступных поддонов для станка без сменного задания
export const fetchAvailablePallets = async (detailId: number): Promise<ProductionPallet[]> => {

  try {
        const stageid = getSegmentIdFromStorage();
    const response = await axios.get<PalletsResponseDto>(`${API_URL}/machines-no-smen/available-pallets/${detailId}/${stageid}`);
    console.log('Ответ API fetchAvailablePallets:', response.data);
    
    // Обрабатываем данные от API - убеждаемся, что возвращаемый формат корректен
    if (!response.data || !response.data.pallets) {
      console.warn('Некорректный формат ответа API:', response.data);
      
      // Если ответ представляет собой напрямую массив (а не объект с полем pallets)
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    }
    
    return response.data.pallets;
  } catch (error) {
    console.error('Ошибка при получении доступных поддонов:', error);
    throw error;
  }
};

// Функция для взятия поддона в работу (новый API)
export const takeToWork = async (palletId: number): Promise<TakeToWorkResponseDto> => {
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
    
    // Отправляем запрос на новый API эндпоинт
    const response = await axios.post<TakeToWorkResponseDto>(`${API_URL}/machines-no-smen/take-to-work`, {
      palletId: palletId,
      machineId: machine.id,
      operatorId: userData.id,
    });
    
    console.log(`Поддон ${palletId} успешно взят в работу:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при взятии поддона ${palletId} в работу:`, error);
    throw error;
  }
};

// Функция для завершения обработки поддона (новый API)
export const completeProcessing = async (palletId: number): Promise<CompleteProcessingResponseDto> => {
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
    
    // Отправляем запрос на новый API эндпоинт
    const response = await axios.post<CompleteProcessingResponseDto>(`${API_URL}/machines-no-smen/complete-processing`, {
      palletId: palletId,
      machineId: machine.id,
      operatorId: userData.id,
    });
    
    console.log(`Поддон ${palletId} успешно завершен:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при завершении обработки поддона ${palletId}:`, error);
    throw error;
  }
};

// Функция для перемещения поддона в буфер (новый API)
export const moveToBuffer = async (palletId: number, bufferCellId: number): Promise<{ message: string; pallet: any }> => {
  try {
    // Отправляем запрос на новый API эндпоинт
    const response = await axios.post(`${API_URL}/machines-no-smen/move-to-buffer`, {
      palletId: palletId,
      bufferCellId: bufferCellId
    });
    
    console.log(`Поддон ${palletId} успешно перемещен в буфер:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при перемещении поддона ${palletId} в буфер:`, error);
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
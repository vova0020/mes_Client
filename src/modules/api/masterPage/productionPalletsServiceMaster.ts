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
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BUFFERED'| 'PENDING';
  completionStatus?: 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED'| 'BUFFERED'| 'PENDING';
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

// Интерфейс для запроса назначения на станок
export interface AssignToMachineRequest {
  palletId: number;
  machineId: number;
  segmentId: number;
  operatorId?: number;
}

// Интерфейс для запроса перемещения в буфер
export interface MoveToBufferRequest {
  palletId: number;
  bufferCellId: number;
}

// Интерфейс для ответа операции
export interface OperationResponse {
  message: string;
  operation: OperationDto;
}

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
      case 'PENDING': return 'Ожидает обработки';
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
      case 'PENDING': return 'Ожидает обработки';
      case 'FAILED': return 'Ошибка';
      case 'BUFFERED': return 'В буфере';
      default: return 'В обработке';
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
  try {
    const response = await axios.get<PalletsResponseDto>(`${API_URL}/master/pallets/${detailId}`);
    console.log('Ответ API fetchProductionPalletsByDetailId:', response.data);
    
    // Обрабатываем данные от API - убеждаемся, что currentOperation корректно определен
    const processedPallets = response.data.pallets.map(pallet => {
      // Дополнительная проверка и логирование для отладки
      console.log(`Проверка данных поддона ID=${pallet.id}, имя=${pallet.name}:`, {
        hasCurrentOperation: !!pallet.currentOperation,
        currentOperation: pallet.currentOperation
      });
      
      return pallet;
    });
    
    return processedPallets;
  } catch (error) {
    console.error('Ошибка при получении поддонов детали:', error);
    throw error;
  }
};

// Обновленная функция для получения доступных ячеек буфера
export const fetchBufferCellsBySegmentId = async (): Promise<BufferCellDto[]> => {
  try {
    // Получаем segmentId из локального хранилища
    const assignmentsData = localStorage.getItem('assignments');
    let segmentId: number;
    
    if (!assignmentsData) {
      console.error('Отсутствуют данные assignments в localStorage');
      throw new Error('Отсутствуют данные assignments в localStorage');
    }
    
    try {
      const parsedData = JSON.parse(assignmentsData);
      if (!parsedData.stages || parsedData.stages.length === 0) {
        console.error('В данных assignments отсутствуют segments');
        throw new Error('В данных assignments отсутствуют segments');
      }
      segmentId = parsedData.stages[0].id;
    } catch (parseError) {
      console.error('Ошибка при парсинге данных из localStorage:', parseError);
      throw parseError;
    }
    
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

// Обновленная функция для получения доступных станков
export const fetchMachinBySegmentId = async (): Promise<MachineDto[]> => {
  try {
    // Получаем segmentId из локального хранилища
    const assignmentsData = localStorage.getItem('assignments');
    let segmentId: number;
    
    if (!assignmentsData) {
      console.error('Отсутствуют данные assignments в localStorage');
      throw new Error('Отсутствуют данные assignments в localStorage');
    }
    
    try {
      const parsedData = JSON.parse(assignmentsData);
      if (!parsedData.stages || parsedData.stages.length === 0) {
        console.error('В данных assignments отсутствуют segments');
        throw new Error('В данных assignments отсутствуют segments');
      }
      segmentId = parsedData.stages[0].id;
    } catch (parseError) {
      console.error('Ошибка при парсинге данных из localStorage:', parseError);
      throw parseError;
    }
    
    // Формируем URL с обязательным параметром segmentId
    const response = await axios.get(`${API_URL}/machins/master/all?segmentId=${segmentId}`);
    
    // Проверяем формат данных и адаптируем под него
    if (Array.isArray(response.data)) {
      // Если сервер возвращает массив напрямую
      return response.data.map((item: any) => ({
        id: item.machineId,
        name: item.machineName || item.code || '',
        status: item.status || 'ACTIVE'
      }));
    } else if (response.data.machines && Array.isArray(response.data.machines)) {
      // Если сервер возвращает объект с полем machines
      return response.data.machines.map((item: any) => ({
        id: item.machineId,
        name: item.machineName || item.code || '',
        status: item.status || 'ACTIVE'
      }));
    } else {
      // Неизвестный формат, возвращаем пустой массив и логируем ошибку
      console.error('Неожиданный формат данных от сервера:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Ошибка при получении станков:', error);
    throw error;
  }
};

// Новая функция: назначение поддона на станок
export const assignPalletToMachine = async (
  palletId: number, 
  machineId: number, 
  segmentId: number,
  operatorId?: number
): Promise<OperationDto> => {
  try {
    const payload: AssignToMachineRequest = {
      palletId,
      machineId,
      segmentId,
      operatorId
    };
    
    const response = await axios.post<OperationResponse>(
      `${API_URL}/master/assign-to-machine`,
      payload
    );
    
    console.log('Поддон успешно назначен на станок:', response.data);
    return response.data.operation;
  } catch (error) {
    console.error('Ошибка при назначении поддона на станок:', error);
    throw error;
  }
};

// Новая функция: перемещение поддона в буфер
export const movePalletToBuffer = async (
  palletId: number,
  bufferCellId: number
): Promise<OperationDto> => {
  try {
    const payload: MoveToBufferRequest = {
      palletId,
      bufferCellId
    };
    
    const response = await axios.post<OperationResponse>(
      `${API_URL}/master/move-to-buffer`,
      payload
    );
    
    console.log('Поддон успешно перемещен в буфер:', response.data);
    return response.data.operation;
  } catch (error) {
    console.error('Ошибка при перемещении поддона в буфер:', error);
    throw error;
  }
};

// Обновленная функция для обновления станка для поддона
export const updatePalletMachine = async (
  palletId: number, 
  machineName: string, 
  segmentId: number 
): Promise<OperationDto | void> => {
  try {
    // Находим машину по имени - это дополнительный API-запрос
    const machines = await fetchMachinBySegmentId();
    const machine = machines.find(m => m.name === machineName);
    
    if (!machine) {
      throw new Error(`Станок с именем "${machineName}" не найден`);
    }
    
    // Используем новый API для назначения поддона на станок
    return await assignPalletToMachine(palletId, machine.id, segmentId);
  } catch (error) {
    console.error('Ошибка при обновлении станка для поддона:', error);
    throw error;
  }
};

// Обновленная функция для обновления ячейки буфера для поддона
export const updatePalletBufferCell = async (
  palletId: number, 
  bufferCellId: number
): Promise<OperationDto | void> => {
  try {
    // В соответствии с документацией API, мы можем перемещать поддон в буфер 
    // вне зависимости от статуса операции
    return await movePalletToBuffer(palletId, bufferCellId);
  } catch (error) {
    console.error('Ошибка при обновлении ячейки буфера для поддона:', error);
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

// Новая функция: получение текущей операции для поддона
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
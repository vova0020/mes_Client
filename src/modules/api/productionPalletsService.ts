import axios from 'axios';
import { API_URL } from './config';

// Определение интерфейсов согласно документации API
export interface BufferCellDto {
  id: number;
  code: string;
  capacity: number;
  buffer: {
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
  status: 'IN_PROGRESS' | 'BUFFERED' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  quantity?: number;
  productionPallet: {
    id: number;
    name: string;
  };
  machine?: {
    id: number;
    name: string;
    status: string;
  };
  processStep: {
    id: number;
    name: string;
  };
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
  currentOperation?: OperationDto;
  processStepId?: number;
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
  processStepId: number;
  operatorId?: number;
}

// Интерфейс для запроса перемещения в буфер
export interface MoveToBufferRequest {
  operationId: number;
  bufferCellId: number;
}

// Интерфейс для ответа операции
export interface OperationResponse {
  message: string;
  operation: OperationDto;
}

// Функция для получения производственных поддонов по ID детали
export const fetchProductionPalletsByDetailId = async (detailId: number | null): Promise<ProductionPallet[]> => {
  if (detailId === null) {
    return [];
  }
  try {
    const response = await axios.get<PalletsResponseDto>(`${API_URL}/pallets/detail/${detailId}`);
    
    // Возвращаем массив поддонов из ответа API
    return response.data.pallets;
  } catch (error) {
    console.error('Ошибка при получении поддонов детали:', error);
    throw error;
  }
};

// Обновленная функция для получения доступных ячеек буфера
export const fetchBufferCellsBySegmentId = async (): Promise<BufferCellDto[]> => {
  try {
    const response = await axios.get(`${API_URL}/buffer/cells`);
    console.log('Ответ API:', response.data);
    
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
    const response = await axios.get(`${API_URL}/machin/all`);
    console.log('Ответ API:', response.data);
    
    // Проверяем формат данных и адаптируем под него
    if (Array.isArray(response.data)) {
      // Если сервер возвращает массив напрямую
      return response.data.map((item: any) => ({
        id: item.id,
        name: item.name || item.code || '',
        status: item.status || 'ACTIVE'
      }));
    } else if (response.data.machines && Array.isArray(response.data.machines)) {
      // Если сервер возвращает объект с полем machines
      return response.data.machines.map((item: any) => ({
        id: item.id,
        name: item.name || item.code || '',
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
  processStepId: number,
  operatorId?: number
): Promise<OperationDto> => {
  try {
    const payload: AssignToMachineRequest = {
      palletId,
      machineId,
      processStepId,
      operatorId
    };
    
    const response = await axios.post<OperationResponse>(
      `${API_URL}/pallet-operations/assign-to-machine`,
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
  operationId: number,
  bufferCellId: number
): Promise<OperationDto> => {
  try {
    const payload: MoveToBufferRequest = {
      operationId,
      bufferCellId
    };
    
    const response = await axios.post<OperationResponse>(
      `${API_URL}/pallet-operations/move-to-buffer`,
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
  processStepId: number = 1
): Promise<OperationDto | void> => {
  try {
    // Находим машину по имени - это дополнительный API-запрос
    const machines = await fetchMachinBySegmentId();
    const machine = machines.find(m => m.name === machineName);
    
    if (!machine) {
      throw new Error(`Станок с именем "${machineName}" не найден`);
    }
    
    // Используем новый API для назначения поддона на станок
    return await assignPalletToMachine(palletId, machine.id, processStepId);
  } catch (error) {
    console.error('Ошибка при обновлении станка для поддона:', error);
    throw error;
  }
};

// Обновленная функция для обновления ячейки буфера для по��дона
export const updatePalletBufferCell = async (
  palletId: number, 
  bufferCellId: number
): Promise<OperationDto | void> => {
  try {
    // Получаем текущие данные о поддоне, чтобы узнать operationId
    // Это может требовать дополнительного API вызова, если эти данные не доступны
    // Для примера предположим, что у нас есть API для получения текущей операции поддона
    
    // Заглушка для получения operationId
    // В реальном коде нужно сделать API запрос
    const response = await axios.get<{operation: OperationDto | null}>(`${API_URL}/pallets/${palletId}/current-operation`);
    const operation = response.data.operation;
    
    if (!operation) {
      throw new Error(`Текущая операция для поддона ${palletId} не найдена`);
    }
    
    if (operation.status !== 'IN_PROGRESS') {
      throw new Error(`Можно перемещать в буфер только операции в статусе IN_PROGRESS`);
    }
    
    // Используем новый API для перемещения поддона в буфер
    return await movePalletToBuffer(operation.id, bufferCellId);
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
    return response.data.operation;
  } catch (error) {
    console.error('Ошибка при получении текущей операции поддона:', error);
    return null;
  }
};
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

// Определение интерфейса для производственного поддона
export interface ProductionPallet {
  id: number;
  name: string;
  quantity: number;
  detailId: number;
  bufferCell: BufferCellDto | null;
  machine: MachineDto | null;
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

// Функция для обновления станка для поддона (заглушка)
export const updatePalletMachine = async (palletId: number, machine: string): Promise<void> => {
  try {
    // В будущем здесь будет реальный запрос на сервер
    console.log(`Заглушка: Обновление станка ${machine} для поддона ${palletId}`);
    
    // Эмуляция успешного ответа от сервера
    return Promise.resolve();
  } catch (error) {
    console.error('Ошибка при обновлении станка для поддона:', error);
    throw error;
  }
};

// Функция для обновления ячейки буфера для поддона (заглушка)
export const updatePalletBufferCell = async (palletId: number, bufferCellId: number): Promise<void> => {
  try {
    // В будущем здесь будет реальный запрос на сервер
    console.log(`Заглушка: Обновление ячейки буфера ${bufferCellId} для поддона ${palletId}`);
    
    // Эмуляция успешного ответа от сервера
    return Promise.resolve();
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
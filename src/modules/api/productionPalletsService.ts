import axios from 'axios';
import { API_URL } from './config';

// Определение интерфейсов согласно документации API
export interface BufferCellDto {
  id: number;
  code: string;
  bufferId: number;
  bufferName: string;
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

// Функция для обновления ячейки буфера для п��ддона (заглушка)
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
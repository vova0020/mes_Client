import axios from 'axios';
import { API_URL } from '../config';

// Определение интерфейса для данных о станке
export interface Machine {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'BROKEN';
  recommendedLoad: number;
  plannedQuantity: number;
  completedQuantity: number;
}

// Интерфейс для DTO станка
export interface MachineDto {
  id: number;
  name: string;
  status: string;
}

// Интерфейс для задания машины
export interface MachineTask {
  operationId: number;
  priority: number;
  orderId: number;
  orderName: string;
  detailArticle: string;
  detailName: string;
  detailMaterial: string;
  detailSize: string;
  palletName: string;
  quantity: number;
  status: string;
  completionStatus: string | null;
}

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
    if (!parsedData.stages || parsedData.stages.length === 0) {
      console.error('Нет данных assignments отсутствуют segments');
      return null;
    }
    
    return parsedData.stages[0].id;
  } catch (error) {
    console.error('Ошибка при получении segmentId из localStorage:', error);
    return null;
  }
};

/**
 * Получает данные о станках для выбранного сегмента
 * @returns Массив станков
 */
export const fetchMachinesBySegment = async (): Promise<Machine[]> => {
  try {
    const segmentId = getSegmentIdFromStorage();
    
    if (segmentId === null) {
      console.error('Не удалось получить ID сегмента из localStorage');
      throw new Error('Не удалось получить ID сегмента из localStorage');
    }
    
    const response = await axios.get<Machine[]>(`${API_URL}/machins/master/machines`, {
      params: {
        segmentId: segmentId
      }
    });
    
    // Преобразуем статусы к верхнему регистру для совместимости с интерфейсом
    const machines = response.data.map(machine => ({
      ...machine,
      status: machine.status.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'BROKEN'
    }));
    
    return machines;
  } catch (error) {
    console.error('Ошибка при получении данных о станках:', error);
    throw error;
  }
};

/**
 * Получает сменное задание для конкретного станка
 * @param machineId ID станка
 * @returns Массив заданий для станка
 */
export const fetchMachineTasks = async (machineId: number): Promise<MachineTask[]> => {
  try {
    const response = await axios.get<MachineTask[]>(`${API_URL}/master/machine-tasks`, {
      params: {
        machineId
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении сменного задания для станка ${machineId}:`, error);
    throw error;
  }
};

/**
 * Удаляет задание по ID операции
 * @param operationId ID операции
 * @returns С��общение об успешном удалении
 */
export const deleteTask = async (operationId: number): Promise<{ message: string }> => {
  try {
    const response = await axios.delete<{ message: string }>(
      `${API_URL}/machins/master/task/${operationId}`
    );
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при удалении задания с ID ${operationId}:`, error);
    throw error;
  }
};

/**
 * Перемещает задание на другой станок
 * @param operationId ID операции
 * @param targetMachineId ID целевого станка
 * @returns Сообщение об успешном перемещении
 */
export const moveTask = async (
  operationId: number,
  targetMachineId: number
): Promise<{ message: string }> => {
  try {
    const response = await axios.post<{ message: string }>(
      `${API_URL}/machins/master/task/move`,
      {
        operationId,
        targetMachineId
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при перемещении задания с ID ${operationId} на станок ${targetMachineId}:`, error);
    throw error;
  }
};

/**
 * Получает список всех станков сегмента для выбора
 * @returns Массив DTO станков
 */
export const fetchMachinesBySegmentId = async (): Promise<MachineDto[]> => {
  try {
    // Получаем segmentId из локального хранилища
    const segmentId = getSegmentIdFromStorage();
    
    if (segmentId === null) {
      console.error('Не удалось получить ID сегмента из localStorage');
      throw new Error('Не удалось получить ID сегмента из localStorage');
    }
    
    // Формируем URL с обязательным параметром segmentId
    const response = await axios.get(`${API_URL}/machins/master/all`, {
      params: {
        segmentId
      }
    });
    
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
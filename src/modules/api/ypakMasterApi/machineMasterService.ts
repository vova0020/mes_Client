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

// Интерфейс для задания машины (обновлен под новую структуру данных)
export interface MachineTask {
  taskId: number;
  packageId: number;
  machineId: number;
  assignedTo: string | null;
  status: string;
  priority: number;
  assignedAt: string;
  completedAt: string | null;
  machine: {
    machineId: number;
    machineName: string;
    status: string;
  };
  package: {
    packageId: number;
    packageName: string;
    status: string;
  };
  productionPackage: {
    packageId: number;
    packageCode: string;
    packageName: string;
    completionPercentage: number;
    quantity: number;
    order: {
      orderId: number;
      batchNumber: string;
      orderName: string;
      completionPercentage: number;
      isCompleted: boolean;
      launchPermission: boolean;
    };
  };
}

/**
 * Получает ID выбранного этапа из localStorage
 * @returns ID этапа или null, если не удалось получить
 */
const getSelectedStageIdFromStorage = (): number | null => {
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

/**
 * Получает данные о станках для выбранного этапа
 * @returns Массив станков
 */
export const fetchMachinesBySegment = async (): Promise<Machine[]> => {
  try {
    const stageId = getSelectedStageIdFromStorage();
    
    if (stageId === null) {
      console.error('Не удалось получить ID этапа из localStorage');
      throw new Error('Не удалось получить ID этапа из localStorage');
    }
    
    const response = await axios.get<Machine[]>(`${API_URL}/machins/master/machines`, {
      params: {
        stageId: stageId
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
    const stageId = getSelectedStageIdFromStorage();
    
    if (stageId === null) {
      console.error('Не удалось получить ID этапа из localStorage');
      throw new Error('Не удалось получить ID этапа из localStorage');
    }
    
    const response = await axios.get<MachineTask[]>(`${API_URL}/machines`, {
      params: {
        stageId: stageId
      }
    });
    
    // Фильтруем задания только для указанного станка
    const filteredTasks = response.data.filter(task => task.machineId === machineId);
    
    return filteredTasks;
  } catch (error) {
    console.error(`Ошибка при получении сменного задания для станка ${machineId}:`, error);
    throw error;
  }
};

/**
 * Удаляет задание по ID задания
 * @param taskId ID задания
 * @returns Сообщение об успешном удалении
 */
export const deleteTask = async (taskId: number): Promise<{ message: string }> => {
  try {
    const response = await axios.delete<{ message: string }>(
      `${API_URL}/packing-task-management/${taskId}`
    );
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при удалении задания с ID ${taskId}:`, error);
    throw error;
  }
};

/**
 * Перемещает задание на другой станок
 * @param taskId ID задания
 * @param targetMachineId ID целевого станка
 * @returns Сообщение об успешном перемещении
 */
export const moveTask = async (
  taskId: number,
  targetMachineId: number
): Promise<{ message: string }> => {
  try {
    const response = await axios.put<{ message: string }>(
      `${API_URL}/packing-task-management/${taskId}/move`,
      {
        machineId: targetMachineId
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при перемещении задания с ID ${taskId} на станок ${targetMachineId}:`, error);
    throw error;
  }
};

/**
 * Получает список всех станков этапа для выбора
 * @returns Массив DTO станков
 */
export const fetchMachinesBySegmentId = async (): Promise<MachineDto[]> => {
  try {
    // Получаем stageId из локального хранилища
    const stageId = getSelectedStageIdFromStorage();
    console.log(`ID для запроса ${stageId}`);
    
    
    if (stageId === null) {
      console.error('Не удалось получить ID этапа из localStorage');
      throw new Error('Не удалось получить ID этапа из localStorage');
    }
    
    // Формируем URL с обязательным параметром stageId
    const response = await axios.get(`${API_URL}/machins/master/all`, {
      params: {
        stageId
      }
    });
    
    // Проверяем формат данных и адаптируем под него
    if (Array.isArray(response.data)) {
      // Если сервер возвращает массив напрям��ю
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

/**
 * Обновляет приоритет задания
 * @param partId ID детали
 * @param machineId ID станка
 * @param priority Новый приоритет
 * @returns Сообщение об успешном обновлении
 */
export const updateTaskPriority = async (
  partId: number,
  machineId: number,
  priority: number
): Promise<{ message: string }> => {
  try {
    const response = await axios.put<{ message: string }>(
      `${API_URL}/production/details/master/part/${partId}/machine/${machineId}/priority`,
      {
        priority
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при обновлении приоритета для детали ${partId} на станке ${machineId}:`, error);
    throw error;
  }
};

/**
 * Создает новое назначение задания на станок уп��ковки
 * @param packageId ID упаковки
 * @param machineId ID станка
 * @returns Сообщение об успешном создании назначения
 */
export const createPackingAssignment = async (
  packageId: number,
  machineId: number
): Promise<{ message: string }> => {
  try {
    const response = await axios.post<{ message: string }>(
      `${API_URL}/packing-assignments`,
      {
        packageId,
        machineId
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при создании назначения упаковки ${packageId} на станок ${machineId}:`, error);
    throw error;
  }
};

/**
 * Обновляет статус задания упаковки на "В работе"
 * @param taskId ID задания
 * @returns Сообщение об успешном обновлении
 */
export const startPackingTask = async (taskId: number): Promise<{ message: string }> => {
  try {
    const response = await axios.put<{ message: string }>(
      `${API_URL}/packing-task-management/${taskId}/start`,
      {},
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при запуске задания упаковки ${taskId}:`, error);
    throw error;
  }
};

/**
 * Обновляет статус задания упаковки на "Завершено"
 * @param taskId ID задания
 * @returns Сообщение об успешном обновлении
 */
export const completePackingTask = async (taskId: number): Promise<{ message: string }> => {
  try {
    const response = await axios.put<{ message: string }>(
      `${API_URL}/packing-task-management/${taskId}/complete`,
      {},
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при завершении задания упаковки ${taskId}:`, error);
    throw error;
  }
};
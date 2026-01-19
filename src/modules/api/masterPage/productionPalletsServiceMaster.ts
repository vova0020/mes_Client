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
  status: 'NOT_PROCESSED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BUFFERED' | 'PENDING';
  completionStatus?: 'NOT_PROCESSED' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'BUFFERED' | 'PENDING';
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
  unallocatedQuantity?: number; // Количество нераспределенных деталей
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

// Интерфейс для запроса создания поддона
export interface CreatePalletRequest {
  partId: number;
  quantity: number;
  palletName?: string;
}

// Интерфейс для ответа создания поддона
export interface CreatePalletResponse {
  message: string;
  pallet: {
    id: number;
    name: string;
    partId: number;
    quantity: number;
    createdAt: string;
    part: {
      id: number;
      code: string;
      name: string;
      material: string;
      totalQuantity: number;
      availableQuantity: number;
    };
  };
}

// Интерфейс для запроса отбраковки деталей
export interface DefectPartsRequest {
  palletId: number;
  quantity: number;
  reportedById: number;
  stageId: number;
  description?: string;
  machineId?: number;
}

// Интерфейс для ответа отбраковки деталей
export interface DefectPartsResponse {
  message: string;
  reclamation: {
    id: number;
    quantity: number;
    palletDeleted: boolean;
  };
}

// Интерфейс для распределения деталей
export interface PartDistribution {
  targetPalletId?: number;
  quantity: number;
  palletName?: string;
}

// Интерфейс для запроса перераспределения деталей
export interface RedistributePartsRequest {
  sourcePalletId: number;
  machineId?: number;
  distributions: PartDistribution[];
}

// Интерфейс для ответа перераспределения деталей
export interface RedistributePartsResponse {
  message: string;
  result: {
    sourcePalletDeleted: boolean;
    createdPallets: {
      id: number;
      name: string;
      quantity: number;
    }[];
    updatedPallets: {
      id: number;
      name: string;
      newQuantity: number;
    }[];
  };
}

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

// Функция для получения текста статуса операции в удобном для отображения формате
export const getOperationStatusText = (operation?: OperationDto | null): string => {
  // Отладочный вывод
  // console.log('getOperationStatusText получил операцию:', operation);

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
      default: return 'Не в обработке';
    }
  }

  // Если нет completionStatus, используем status
  if (operation.status) {
    switch (operation.status) {
      case 'IN_PROGRESS': return 'В работе';
      case 'NOT_PROCESSED': return 'Предыдущий этап пройдет';
      case 'COMPLETED': return 'Готово';
      case 'PENDING': return 'Ожидает обработки';
      case 'FAILED': return 'Ошибка';
      case 'BUFFERED': return 'В буфере';
      default: return 'Не в обработке';
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
export const fetchProductionPalletsByDetailId = async (detailId: number | null): Promise<{ pallets: ProductionPallet[], unallocatedQuantity: number }> => {
  if (detailId === null) {
    return { pallets: [], unallocatedQuantity: 0 };
  }

  const stageid = getSegmentIdFromStorage();
  try {
    const response = await axios.get<PalletsResponseDto>(`${API_URL}/master/pallets/${detailId}/${stageid}`);
    // console.log('Ответ API fetchProductionPalletsByDetailId:', response.data);

    // Обрабатываем данные от API - убеждаемся, что currentOperation корректно определен
    const processedPallets = response.data.pallets.map(pallet => {
      // Дополнительная проверка и логирование для отладки
      // console.log(`Проверка данных поддона ID=${pallet.id}, имя=${pallet.name}:`, {
      //   hasCurrentOperation: !!pallet.currentOperation,
      //   currentOperation: pallet.currentOperation
      // });

      return pallet;
    });

    return {
      pallets: processedPallets,
      unallocatedQuantity: response.data.unallocatedQuantity || 0
    };
  } catch (error) {
    console.error('Ошибка при получении поддонов детали:', error);
    throw error;
  }
};

// Обновленная функция для получения доступных ячеек буфера
export const fetchBufferCellsBySegmentId = async (): Promise<BufferCellDto[]> => {
  try {
    // Получаем segmentId из локального хранилища

    let segmentId = getSegmentIdFromStorage();


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
    const stageId = getSegmentIdFromStorage();

    // Формируем URL с обязательным параметром segmentId
    const response = await axios.get(`${API_URL}/machins/master/all?stageId=${stageId}`);

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
  segmentId: number | null,
  operatorId?: number
): Promise<OperationDto> => {
  try {
    if (segmentId === null) {
      throw new Error('segmentId не может быть null при обновлении машины у поддона');
    }
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

    // console.log('Поддон успешно назначен на станок:', response.data);
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

    // console.log('Поддон успешно перемещен в буфер:', response.data);
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

): Promise<OperationDto | void> => {
  try {
    const segmentId = getSegmentIdFromStorage();
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
    const response = await axios.get<{ operation: OperationDto | null }>(`${API_URL}/pallets/${palletId}/current-operation`);
    // console.log(`Получена операция для поддона ${palletId}:`, response.data);
    return response.data.operation;
  } catch (error) {
    console.error('Ошибка при получении текущей операции поддона:', error);
    return null;
  }
};

// Новая функция: создание поддона по ID детали
export const createPalletByPart = async (
  partId: number,
  quantity: number,
  palletName?: string
): Promise<CreatePalletResponse> => {
  try {
    const payload: CreatePalletRequest = {
      partId,
      quantity,
      palletName
    };

    const response = await axios.post<CreatePalletResponse>(
      `${API_URL}/master/create-pallet-by-part`,
      payload
    );

    console.log('Поддон успешно создан:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании поддона:', error);
    throw error;
  }
};

// Функция для отбраковки деталей с поддона
export const defectParts = async (
  palletId: number,
  quantity: number,
  description?: string,
  machineId?: number
): Promise<DefectPartsResponse> => {
  try {
    // Получаем данные пользователя из localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      throw new Error('Данные пользователя не найдены');
    }
    const user = JSON.parse(userData);
    const reportedById = user.id;

    // Получаем stageId из localStorage
    const stageId = getSegmentIdFromStorage();
    if (!stageId) {
      throw new Error('ID этапа не найден');
    }

    const payload: DefectPartsRequest = {
      palletId,
      quantity,
      reportedById,
      stageId,
      description,
      machineId
    };

    const response = await axios.post<DefectPartsResponse>(
      `${API_URL}/master/defect-parts`,
      payload
    );

    console.log('Детали успешно отбракованы:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при отбраковке деталей:', error);
    throw error;
  }
};

// Функция для перераспределения деталей между поддонами
export const redistributeParts = async (
  sourcePalletId: number,
  distributions: PartDistribution[],
  machineId?: number
): Promise<RedistributePartsResponse> => {
  try {
    const payload: RedistributePartsRequest = {
      sourcePalletId,
      distributions,
      machineId
    };

    const response = await axios.post<RedistributePartsResponse>(
      `${API_URL}/machins/pallets/redistribute-parts`,
      payload
    );

    console.log('Детали успешно перераспределены:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при перераспределении деталей:', error);
    throw error;
  }
};

// Интерфейс для запроса возврата деталей
export interface ReturnPartsRequest {
  partId: number;
  palletId: number;
  quantity: number;
  userId: number;
}

// Интерфейс для ответа возврата деталей
export interface ReturnPartsResponse {
  message: string;
  movement: {
    id: number;
    quantity: number;
    pallet: {
      id: number;
      name: string;
      newQuantity: number;
    };
    defectStats: {
      totalDefective: number;
      alreadyReturned: number;
      remainingToReturn: number;
    };
  };
}

// Функция для возврата деталей в производство
export const returnParts = async (
  partId: number,
  palletId: number,
  quantity: number
): Promise<ReturnPartsResponse> => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      throw new Error('Данные пользователя не найдены');
    }
    const user = JSON.parse(userData);
    const userId = user.id;

    const payload: ReturnPartsRequest = {
      partId,
      palletId,
      quantity,
      userId
    };

    const response = await axios.post<ReturnPartsResponse>(
      `${API_URL}/master/return-parts`,
      payload
    );

    console.log('Детали успешно возвращены в производство:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при возврате деталей:', error);
    throw error;
  }
};
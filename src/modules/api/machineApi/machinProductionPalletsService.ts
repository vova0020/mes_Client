import axios from 'axios';
import { API_URL } from '../config';

// Определение интерфейсов согласно реальной структуре данных API
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

// Обновленный интерфейс для этапа маршрута
export interface RouteStageDto {
  id: number;
  name: string;
  sequence: number;
}

// Интерфейс для прогресса этапа
export interface StageProgressDto {
  id: number;
  status: 'NOT_PROCESSED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BUFFERED' | 'ON_MACHINE';
  completedAt: string | null;
  routeStage: RouteStageDto;
}

// Интерфейс для статуса обработки
export interface ProcessingStatusDto {
  isFirstStageInRoute: boolean;
  hasCompletedPreviousStages: boolean;
  currentStage: {
    id: number;
    name: string;
  };
  nextStage: {
    id: number;
    name: string;
  } | null;
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

// Исправленный интерфейс OperationDto с правильным типом completedAt
export interface OperationDto {
  id: number;
  status: 'NOT_PROCESSED' | 'PENDING' |'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BUFFERED'| 'ON_MACHINE';
  completionStatus?: 'NOT_PROCESSED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED'| 'BUFFERED'| 'ON_MACHINE';
  startedAt: string;
  completedAt: string | null; // Изменено с string | undefined на string | null для совместимости
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

// Обновленный интерфейс для детали (part)
export interface PartDto {
  id: number;
  article: string;
  name: string;
  material: string;
  size: string;
  totalNumber: number;
  completed: number;
  readyForProcessing: number;
  status: string;
  isCompletedForStage: boolean;
}

// Определение интерфейса для детали (добавлено для обратной совместимости)
export interface DetailDto {
  id: number;
  article: string;
  name: string;
  material: string;
  size: string;
  totalNumber: number;
  // Другие поля детали, которые могут присутствовать
}

// Обновленный интерфейс для производственного поддона согласно реальной структуре API
export interface ProductionPallet {
  id: number;
  name: string;
  quantity: number;
  bufferCell: BufferCellDto | null;
  machine: MachineDto | null;
  
  // Новые поля согласно реальной структуре API
  currentStageId: number;
  currentStageName: string;
  currentStageProgress: StageProgressDto;
  part: PartDto;
  processingStatus: ProcessingStatusDto;
  status: string;
  
  // Старые поля для обратной совместимости
  detailId?: number;
  currentOperation?: OperationDto | null;
  segmentId?: number;
  currentStepId?: number;
  currentStepName?: string;
  detail?: DetailDto;
  currentStep?: ProcessStepDto;
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

const getSegmentIdFromStorage = (): number | null => {
  try {
    const stageId = localStorage.getItem('selectedMachineStageId');
    if (stageId) {
      return Number(stageId);
    }

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
    
    return parsedData.machines[0].stages?.[0]?.id || null;
  } catch (error) {
    console.error('Ошибка при получении segmentId из localStorage:', error);
    return null;
  }
};
/**
 * Получает ID сегмента из выбранного поля из localStorage
 * @returns ID сегмента или null, если не удалось получить
 */
const getSegmentIdFromSelectedStage = (): number | null => {
  try {
    const selectedStage = localStorage.getItem('selectedStage');
    if (!selectedStage) {
      console.error('Отсутствуют данные selectedStage в localStorage');
      return null;
    }
    
    const parsedData = JSON.parse(selectedStage);
    if (!parsedData || parsedData.length === 0) {
      console.error('Нет данных selectedStage отсутствуют segments');
      return null;
    }

    return parsedData.id;
  } catch (error) {
    console.error('Ошибка при получении segmentId из localStorage:', error);
    return null;
  }
};

const getMachinIdFromStorage = (): number | null => {
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
    
    return parsedData.machines[0].id;
  } catch (error) {
    console.error('Ошибка при получении segmentId из localStorage:', error);
    return null;
  }
};

// Функция для получения текста статуса операции в удобном для отображения формате
export const getOperationStatusText = (pallet?: ProductionPallet | null): string => {
  // Отладочный вывод
  
  // console.log('getOperationStatusText получил поддон:', pallet);
  
  // Проверка наличия поддона
  if (!pallet) {
    return 'Не в обработке';
  }
  
  // Используем currentStageProgress для определения статуса
  if (pallet) {
    switch (pallet.status) {
      case 'IN_PROGRESS': return 'В работе';
      case 'COMPLETED': return 'Готово';
      case 'ON_MACHINE': return 'Ожидает обработки';
      case 'FAILED': return 'Ошибка';
      case 'BUFFERED': return 'В буфере';
      default: return 'Не обрабатывается';
    }
  }
  
  // // Проверка старого формата для обратной совместимости
  // if (pallet.currentOperation) {
  //   const operation = pallet.currentOperation;
  //   if (operation.status) {
  //     switch (operation.status) {
  //       case 'IN_PROGRESS': return 'В работе';
  //       case 'COMPLETED': return 'Готово';
  //       case 'ON_MACHINE': return 'Ожидает обработки';
  //       case 'FAILED': return 'Ошибка';
  //       case 'BUFFERED': return 'В буфере';
  //       default: return 'Не обрабатывается';
  //     }
  //   }
  // }
  
  // Если ничего не подошло
  return 'Статус неизвестен';
};

// Функция для получения текста текущего этапа обработки
export const getProcessStepText = (pallet?: ProductionPallet | null): string => {
  if (!pallet) return 'Нет данных';
  
  // Используем новую структуру данных
  if (pallet.currentStageName) {
    const sequence = pallet.currentStageProgress?.routeStage?.sequence;
    return `${pallet.currentStageName}${sequence ? ` (этап ${sequence})` : ''}`;
  }
  
  // Старый формат для обратной совместимости
  if (pallet.currentOperation?.processStep) {
    const step = pallet.currentOperation.processStep;
    return `${step.name}${step.sequence ? ` (этап ${step.sequence})` : ''}`;
  }
  
  return 'Нет данных';
};

// Обновленная функция для получения производственных поддонов по ID детали
export const fetchProductionPalletsByDetailId = async (detailId: number | null): Promise<ProductionPallet[]> => {
  if (detailId === null) {
    return [];
  }
  
  const stageId = getSegmentIdFromStorage();
  if (stageId === null) {
    console.error('Не удалось получить ID сегмента из localStorage');
    throw new Error('Не удалось получить ID сегмента из localStorage');
  }
  const machinId = getMachinIdFromStorage();
  if (machinId === null) {
    console.error('Не удалось получить ID станка из localStorage');
    throw new Error('Не удалось получить ID станка из localStorage');
  }
  
  try {
    const response = await axios.get<PalletsResponseDto>(`${API_URL}/machins/pallets/detail/pallets`, {
      params: {
        detailId: detailId,
        stageId: stageId,
        machinId: machinId,
      }
    });
    
    // console.log('Ответ API fetchProductionPalletsByDetailId:', response.data);
    
    // Обрабатываем новую структуру ответа {pallets, total}
    if (!response.data) {
      console.warn('Пустой ответ от API');
      return [];
    }
    
    // Если ответ представляет собой объект с полем pallets
    if (response.data.pallets && Array.isArray(response.data.pallets)) {
      const processedPallets = response.data.pallets.map(pallet => {
        // Добавляем поля для обратной совместимости
        const processedPallet: ProductionPallet = {
          ...pallet,
          // Маппинг новых полей в старые для обратной совместимости
          detailId: pallet.part?.id || detailId,
          detail: pallet.part ? {
            id: pallet.part.id,
            article: pallet.part.article,
            name: pallet.part.name,
            material: pallet.part.material,
            size: pallet.part.size,
            totalNumber: pallet.part.totalNumber
          } : undefined,
          currentStepId: pallet.currentStageId,
          currentStepName: pallet.currentStageName,
          // Создаем currentOperation из currentStageProgress для совместимости
          currentOperation: pallet.currentStageProgress ? {
            id: pallet.currentStageProgress.id,
            status: pallet.currentStageProgress.status,
            startedAt: new Date().toISOString(), // Заглушка, так как нет этого поля в новой структуре
            completedAt: pallet.currentStageProgress.completedAt, // Теперь типы совместимы: string | null
            processStep: pallet.currentStageProgress.routeStage ? {
              id: pallet.currentStageProgress.routeStage.id,
              name: pallet.currentStageProgress.routeStage.name,
              sequence: pallet.currentStageProgress.routeStage.sequence
            } : undefined,
            isCompletedForDetail: pallet.part?.isCompletedForStage
          } : null
        };
        
        // Дополнительная проверка и логирование для отладки
        // console.log(`Проверка данных поддона ID=${pallet.id}, имя=${pallet.name}:`, {
        //   hasCurrentStageProgress: !!pallet.currentStageProgress,
        //   currentStageProgress: pallet.currentStageProgress,
        //   currentStageName: pallet.currentStageName,
        //   processedOperation: processedPallet.currentOperation
        // });
        
        return processedPallet;
      });
      
      return processedPallets;
    }
    
    // Если ответ представляет собой напрямую массив (старый формат)
    if (Array.isArray(response.data)) {
      // console.log('Получен старый формат ответа (массив)');
      return response.data;
    }
    
    console.warn('Некорректный формат ответа API:', response.data);
    return [];
  } catch (error) {
    console.error('Ошибка при получении поддонов детали:', error);
    throw error;
  }
};

// Функция для получения доступных ячеек буфера
export const fetchBufferCellsBySegmentId = async (): Promise<BufferCellDto[]> => {
  try {
    // Получаем segmentId из локального хранилища
    const segmentId = getSegmentIdFromSelectedStage();
    if (!segmentId) {
      console.error('Отсутствуют данные о сегменте в localStorage');
      throw new Error('Отсутствуют данные о сегменте в localStorage');
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

// Функция для перевода поддона в статус "В работу"
export const startPalletProcessing = async (palletId: number, machineId: number, operatorId: number, stageId: number): Promise<OperationDto | null> => {
  try {
    const response = await axios.post(`${API_URL}/machins/pallets/start-processing`, {
      palletId,
      machineId,
      operatorId,
      stageId
    });
    
    return response.data.operation || null;
  } catch (error) {
    console.error(`Ошибка при переводе поддона ${palletId} в статус "В работу":`, error);
    throw error;
  }
};

// Функция для перевода поддона в статус "Готово"
export const completePalletProcessing = async (palletId: number, machineId: number, operatorId: number, stageId: number): Promise<CompleteProcessingResponseDto> => {
  try {
    const response = await axios.post(`${API_URL}/machins/pallets/complete-processing`, {
      palletId,
      machineId,
      operatorId,
      stageId
    });
    
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
    const response = await axios.post(`${API_URL}/machins/pallets/move-to-buffer`, {
      palletId: palletId,
      bufferCellId: bufferCellId
    });
    
    // console.log(`Буферная ячейка для поддона ${palletId} успешно обновлена:`, response.data);
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
    // console.log(`Получена операция для поддона ${palletId}:`, response.data);
    return response.data.operation;
  } catch (error) {
    console.error('Ошибка при получении текущей операции поддона:', error);
    return null;
  }
};

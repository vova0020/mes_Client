// src/modules/api/masterPage/operatorBindingMasterService.ts
import axios from 'axios';
import { API_URL } from '../config';

// ===== Интерфейсы =====

/** Участок (этап 1-го уровня) мастера */
export interface MasterSegment {
  stageId: number;
  stageName: string;
}

/** Оператор, привязанный к станку */
export interface BoundOperator {
  userId: number;
  operatorNumber: number;
  firstName: string;
  lastName: string;
  position: string | null;
  boundAt: string;
}

/** Станок с привязанными операторами */
export interface MachineWithOperators {
  machineId: number;
  machineName: string;
  machineCode: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'BROKEN';
  operatorsCount: number;
  operators: BoundOperator[];
}

/** Текущая привязка оператора */
export interface OperatorCurrentBinding {
  machineId: number;
  machineName: string;
  machineCode: string | null;
  operatorNumber: number;
  boundAt: string;
}

/** Оператор из списка */
export interface OperatorInfo {
  userId: number;
  firstName: string;
  lastName: string;
  position: string | null;
  isBound: boolean;
  currentBinding?: OperatorCurrentBinding;
}

/** Ответ на привязку оператора */
export interface BindOperatorResponse {
  success: boolean;
  message: string;
  binding: {
    bindingId: number;
    machineId: number;
    machineName: string;
    machineCode: string | null;
    operatorNumber: number;
    boundAt: string;
  };
}

/** Ответ на отвязку оператора */
export interface UnbindOperatorResponse {
  success: boolean;
  message: string;
  unboundAt: string;
}

/** Ответ на смену номера оператора */
export interface ChangeNumberResponse {
  success: boolean;
  message: string;
  oldNumber: number;
  newNumber: number;
}

// ===== Вспомогательные функции =====

/**
 * Получает ID мастера из localStorage
 */
const getMasterIdFromStorage = (): number | null => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.error('Отсутствуют данные user в localStorage');
      return null;
    }
    const user = JSON.parse(userData);
    return user.id || null;
  } catch (error) {
    console.error('Ошибка при получении masterId из localStorage:', error);
    return null;
  }
};

/**
 * Получает ID выбранного участка из localStorage
 */
const getSelectedStageIdFromStorage = (): number | null => {
  try {
    const selectedStageData = localStorage.getItem('selectedStage');
    if (!selectedStageData) {
      console.error('Отсутствуют данные selectedStage в localStorage');
      return null;
    }
    const parsedData = JSON.parse(selectedStageData);
    return parsedData?.id || null;
  } catch (error) {
    console.error('Ошибка при получении stageId из localStorage:', error);
    return null;
  }
};

// ===== Базовый путь =====
const BASE_PATH = '/machins/master/operator-binding';

// ===== API функции =====

/**
 * Получить участки мастера
 * GET /machins/master/operator-binding/segments?masterId={masterId}
 */
export const fetchMasterSegments = async (masterId?: number): Promise<MasterSegment[]> => {
  const id = masterId ?? getMasterIdFromStorage();
  if (!id) {
    throw new Error('Не удалось определить ID мастера');
  }

  try {
    const response = await axios.get<MasterSegment[]>(`${API_URL}${BASE_PATH}/segments`, {
      params: { masterId: id },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Пользователь не найден');
    }
    console.error('Ошибка при получении участков мастера:', error);
    throw error;
  }
};

/**
 * Получить станки участка с операторами
 * GET /machins/master/operator-binding/machines?stageId={stageId}
 */
export const fetchMachinesWithOperators = async (stageId?: number): Promise<MachineWithOperators[]> => {
  const id = stageId ?? getSelectedStageIdFromStorage();
  if (!id) {
    throw new Error('Не удалось определить ID участка');
  }

  try {
    const response = await axios.get<MachineWithOperators[]>(`${API_URL}${BASE_PATH}/machines`, {
      params: { stageId: id },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Участок не найден');
    }
    console.error('Ошибка при получении станков с операторами:', error);
    throw error;
  }
};

/**
 * Получить список операторов
 * GET /machins/master/operator-binding/operators
 * GET /machins/master/operator-binding/operators?stageId={stageId}
 */
export const fetchOperators = async (stageId?: number): Promise<OperatorInfo[]> => {
  try {
    const params: Record<string, number> = {};
    if (stageId) {
      params.stageId = stageId;
    }

    const response = await axios.get<OperatorInfo[]>(`${API_URL}${BASE_PATH}/operators`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка операторов:', error);
    throw error;
  }
};

/**
 * Привязать оператора к станку
 * POST /machins/master/operator-binding/bind
 */
export const bindOperator = async (
  operatorId: number,
  machineId: number,
  operatorNumber?: number
): Promise<BindOperatorResponse> => {
  try {
    const body: { operatorId: number; machineId: number; operatorNumber?: number } = {
      operatorId,
      machineId,
    };
    if (operatorNumber !== undefined) {
      body.operatorNumber = operatorNumber;
    }

    const response = await axios.post<BindOperatorResponse>(`${API_URL}${BASE_PATH}/bind`, body);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const message = error.response.data?.message;
      if (status === 404) {
        throw new Error(message || 'Оператор или станок не найден');
      }
      if (status === 409) {
        throw new Error(message || 'Оператор уже привязан к другому станку');
      }
      throw new Error(message || 'Ошибка при привязке оператора');
    }
    throw new Error('Ошибка сети или сервера');
  }
};

/**
 * Отвязать оператора от станка
 * POST /machins/master/operator-binding/unbind
 */
export const unbindOperator = async (
  operatorId: number,
  machineId: number
): Promise<UnbindOperatorResponse> => {
  try {
    const response = await axios.post<UnbindOperatorResponse>(`${API_URL}${BASE_PATH}/unbind`, {
      operatorId,
      machineId,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const message = error.response.data?.message;
      throw new Error(message || 'Ошибка при отвязке оператора');
    }
    throw new Error('Ошибка сети или сервера');
  }
};

/**
 * Изменить номер оператора на станке
 * PUT /machins/master/operator-binding/change-number
 */
export const changeOperatorNumber = async (
  operatorId: number,
  machineId: number,
  newOperatorNumber: number
): Promise<ChangeNumberResponse> => {
  try {
    const response = await axios.put<ChangeNumberResponse>(`${API_URL}${BASE_PATH}/change-number`, {
      operatorId,
      machineId,
      newOperatorNumber,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const message = error.response.data?.message;
      throw new Error(message || 'Ошибка при смене номера оператора');
    }
    throw new Error('Ошибка сети или сервера');
  }
};

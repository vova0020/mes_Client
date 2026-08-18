import axios from 'axios';
import { API_URL } from '../config';

// Интерфейсы для типизации данных
export interface MachineBinding {
  machineId: number;
  machineName: string;
  machineCode: string;
  operatorNumber: number;
  boundAt: string;
}

export interface OtherOperator {
  userId: number;
  operatorNumber: number;
  firstName: string;
  lastName: string;
  position: string;
  boundAt: string;
}

export interface BindingStatusResponse {
  isBound: boolean;
  machine?: MachineBinding;
  otherOperators?: OtherOperator[];
}

export interface BindRequest {
  userId: number;
  machineCode: string;
}

export interface BindResponse {
  success: boolean;
  message: string;
  binding: {
    bindingId: number;
    machineId: number;
    machineName: string;
    machineCode: string;
    operatorNumber: number;
    boundAt: string;
  };
  otherOperators: OtherOperator[];
}

export interface UnbindRequest {
  userId: number;
  machineId: number;
}

export interface UnbindResponse {
  success: boolean;
  message: string;
  unboundAt: string;
}

export interface ChangeNumberRequest {
  userId: number;
  machineId: number;
  newOperatorNumber: number;
}

export interface ChangeNumberResponse {
  success: boolean;
  message: string;
  oldNumber: number;
  newNumber: number;
}

export interface MachineOperatorsResponse {
  machineId: number;
  machineName: string;
  machineCode: string;
  activeOperators: OtherOperator[];
  totalActive: number;
}

// API функции
const operatorBindingApi = {
  /**
   * Проверить статус привязки оператора
   */
  async getBindingStatus(userId: number): Promise<BindingStatusResponse> {
    try {
      const response = await axios.get(`${API_URL}/operators/bindings/status`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении статуса привязки:', error);
      throw error;
    }
  },

  /**
   * Привязать оператора к станку
   */
  async bindOperator(data: BindRequest): Promise<BindResponse> {
    try {
      const response = await axios.post(`${API_URL}/operators/bindings/bind`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Пробрасываем ошибку с сообщением от сервера
        throw new Error(error.response.data.message || 'Ошибка при привязке к станку');
      }
      throw new Error('Ошибка сети или сервера');
    }
  },

  /**
   * Отвязать оператора от станка
   */
  async unbindOperator(data: UnbindRequest): Promise<UnbindResponse> {
    try {
      const response = await axios.post(`${API_URL}/operators/bindings/unbind`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Ошибка при отвязке от станка');
      }
      throw new Error('Ошибка сети или сервера');
    }
  },

  /**
   * Изменить номер оператора на станке
   */
  async changeOperatorNumber(data: ChangeNumberRequest): Promise<ChangeNumberResponse> {
    try {
      const response = await axios.put(`${API_URL}/operators/bindings/change-number`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Ошибка при смене номера оператора');
      }
      throw new Error('Ошибка сети или сервера');
    }
  },

  /**
   * Получить список операторов на станке
   */
  async getMachineOperators(machineId: number, activeOnly: boolean = true): Promise<MachineOperatorsResponse> {
    try {
      const response = await axios.get(`${API_URL}/operators/bindings/machine`, {
        params: { machineId, activeOnly }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении списка операторов:', error);
      throw error;
    }
  }
};

export default operatorBindingApi;

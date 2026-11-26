import axios from 'axios';
import { API_URL } from '../config';

/**
 * DTO-объект, возвращаемый эндпоинтом GET /api/operator-work-monitor
 */
export interface WorkMonitorOperatorDto {
  userId: number;
  lastName: string;
  firstName: string;
  initials: string;
  isBound: boolean;
  machineName: string | null;
  stageName: string | null;
  operatorNumber: number | null;
  boundAt: string | null;
}

/**
 * API для монитора персонала (привязки операторов к рабочим местам).
 */
const operatorWorkMonitorApi = {
  /**
   * Получить список операторов с текущими привязками к рабочим местам.
   */
  async getWorkMonitor(): Promise<WorkMonitorOperatorDto[]> {
    try {
      const response = await axios.get<WorkMonitorOperatorDto[]>(
        `${API_URL}/operator-work-monitor`
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении монитора персонала:', error);
      throw error;
    }
  },
};

export default operatorWorkMonitorApi;

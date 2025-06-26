// src/navbar/navbar.service.ts

import axios from 'axios';
import { API_URL } from '../config';

// Интерфейсы для типизации данных
export interface Stage {
  id: number;
  name: string;
  finalStage: boolean;
}

export interface NavbarApiResponse {
  stages: Stage[];
}

/**
 * Сервис для работы с API навбара
 */
export class NavbarService {
  /**
   * Получение списка всех доступных этапов
   * @returns Promise<Stage[]> - массив этапов
   */
  static async getStages(): Promise<Stage[]> {
    try {
      const response = await axios.get<NavbarApiResponse>(`${API_URL}/navbar/stage`);
      return response.data.stages;
    } catch (error) {
      console.error('Ошибка при получении этапов:', error);
      throw error;
    }
  }

  /**
   * Фильтрация этапов в зависимости от роли пользователя
   * @param allStages - все доступные этапы
   * @param userRole - роль пользователя
   * @param userStages - этапы, доступные пользователю (для роли master)
   * @returns Stage[] - отфильтрованные этапы
   */
  static filterStagesByRole(
    allStages: Stage[],
    userRole: string,
    userStages?: Stage[]
  ): Stage[] {
    if (userRole === 'master' && userStages) {
      // Для мастера показываем только этапы, к которым он привязан
      const userStageIds = userStages.map(stage => stage.id);
      return allStages.filter(stage => userStageIds.includes(stage.id));
    }
    
    // Для других ролей показываем все этапы
    return allStages;
  }

  /**
   * Получение данных пользователя из localStorage
   * @returns объект с данными пользователя и назначениями
   */
  static getUserDataFromStorage(): {
    userData: any | null;
    assignments: any | null;
  } {
    try {
      const userDataString = localStorage.getItem('user');
      const assignmentsString = localStorage.getItem('assignments');
      
      const userData = userDataString ? JSON.parse(userDataString) : null;
      const assignments = assignmentsString ? JSON.parse(assignmentsString) : null;
      
      return { userData, assignments };
    } catch (error) {
      console.error('Ошибка при получении данных из localStorage:', error);
      return { userData: null, assignments: null };
    }
  }

  /**
   * Сохранение выбранного этапа в localStorage
   * @param stage - выбранный этап
   */
  static saveSelectedStage(stage: Stage): void {
    try {
      localStorage.setItem('selectedStage', JSON.stringify(stage));
    } catch (error) {
      console.error('Ошибка при сохранении выбранного этапа:', error);
    }
  }

  /**
   * Получение выбранного этапа из localStorage
   * @returns Stage | null - выбранный этап или null
   */
  static getSelectedStage(): Stage | null {
    try {
      const selectedStageString = localStorage.getItem('selectedStage');
      return selectedStageString ? JSON.parse(selectedStageString) : null;
    } catch (error) {
      console.error('Ошибка при получении выбранного этапа:', error);
      return null;
    }
  }

  /**
   * Получение этапов пользователя из assignments
   * @returns Stage[] - массив этапов пользователя
   */
  static getUserStages(): Stage[] {
    try {
      const assignmentsString = localStorage.getItem('assignments');
      if (!assignmentsString) {
        return [];
      }

      const assignments = JSON.parse(assignmentsString);
      return assignments.stages || [];
    } catch (error) {
      console.error('Ошибка при получении этапов пользователя:', error);
      return [];
    }
  }

  /**
   * Установка первого доступного этапа как выбранного
   * @returns Stage | null - установленный этап или null
   */
  static setFirstAvailableStage(): Stage | null {
    try {
      const userStages = this.getUserStages();
      if (userStages.length > 0) {
        const firstStage = userStages[0];
        this.saveSelectedStage(firstStage);
        return firstStage;
      }
      return null;
    } catch (error) {
      console.error('Ошибка при установке первого доступного этапа:', error);
      return null;
    }
  }
}

export default NavbarService;

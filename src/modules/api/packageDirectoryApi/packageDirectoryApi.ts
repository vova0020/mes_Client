import axios from 'axios';
import { API_URL } from '../config';

// Типы данных для API упаковок
export interface PackageDirectory {
  packageId: number;
  packageCode: string;
  packageName: string;
  createdAt: string;
  updatedAt: string;
}

// DTO для создания упаковки
export interface CreatePackageDirectoryDto {
  packageCode: string;
  packageName: string;
}

// DTO для обновления упаковки
export interface UpdatePackageDirectoryDto {
  packageCode?: string;
  packageName?: string;
}

// Ответ при удалении упаковки
export interface DeletePackageDirectoryResponse {
  message: string;
}

/**
 * Сервис для работы с API упаковок
 */
export const packageDirectoryApi = {
  /**
   * Создание новой упаковки
   * @param createDto - Данные для создания упаковки
   * @returns Promise с созданной упаковкой
   */
  create: async (createDto: CreatePackageDirectoryDto): Promise<PackageDirectory> => {
    try {
      console.log('Создание новой упаковки:', createDto);
      const response = await axios.post<PackageDirectory>(`${API_URL}/package-directory`, createDto);
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании упаковки:', error);
      throw error;
    }
  },

  /**
   * Получение всех упаковок
   * @returns Promise с массивом упаковок
   */
  findAll: async (): Promise<PackageDirectory[]> => {
    try {
      console.log('Получение всех упаковок');
      const response = await axios.get<PackageDirectory[]>(`${API_URL}/package-directory`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении упаковок:', error);
      throw error;
    }
  },

  /**
   * Обновление упаковки по ID
   * @param id - Идентификатор упаковки
   * @param updateDto - Данные для обновления
   * @returns Promise с обновленной упаковкой
   */
  update: async (id: number, updateDto: UpdatePackageDirectoryDto): Promise<PackageDirectory> => {
    try {
      console.log(`Обновление упаковки с ID=${id}:`, updateDto);
      const response = await axios.patch<PackageDirectory>(`${API_URL}/package-directory/${id}`, updateDto);
      return response.data;
    } catch (error) {
      console.error('Ошибка при обновлении упаковки:', error);
      throw error;
    }
  },

  /**
   * Удаление упаковки по ID
   * @param id - Идентификатор упаковки
   * @returns Promise с результатом удаления
   */
  remove: async (id: number): Promise<DeletePackageDirectoryResponse> => {
    try {
      console.log(`Удаление упаковки с ID=${id}`);
      const response = await axios.delete<DeletePackageDirectoryResponse>(`${API_URL}/package-directory/${id}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при удалении упаковки:', error);
      throw error;
    }
  },

  /**
   * Получение упаковки по ID
   * @param id - Идентификатор упаковки
   * @returns Promise с данными упаковки
   */
  findById: async (id: number): Promise<PackageDirectory> => {
    try {
      console.log(`Получение упаковки с ID=${id}`);
      const response = await axios.get<PackageDirectory>(`${API_URL}/package-directory/${id}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении упаковки:', error);
      throw error;
    }
  }
};
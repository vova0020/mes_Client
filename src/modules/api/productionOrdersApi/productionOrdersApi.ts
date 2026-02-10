import axios from 'axios';
import { API_URL } from '../config';

// DTO для создания упаковки в справочнике
export interface CreatePackageDirectoryDto {
  packageCode: string;  // Артикул упаковки
  packageName: string;  // Название упаковки
}

// DTO для обновления упаковки в справочнике
export interface UpdatePackageDirectoryDto {
  packageCode?: string;  // Артикул упаковки
  packageName?: string;  // Название упаковки
}

// Статусы заказов
export enum OrderStatus {
  PRELIMINARY = 'PRELIMINARY',
  APPROVED = 'APPROVED',
  LAUNCH_PERMITTED = 'LAUNCH_PERMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  POSTPONED = 'POSTPONED'
}

// DTO для создания упаковки в заказе
export interface CreatePackageDto {
  packageDirectoryId: number; // ID упаковки из справочника
  quantity: number;           // Количество упаковок в заказе
}

// DTO для создания производственного заказа
export interface CreateProductionOrderDto {
  batchNumber: string;        // Номер производственной партии (обязательно)
  orderName: string;          // Название заказа (обязательно)
  requiredDate: string;       // Требуемая дата выполнения (ISO 8601)
  status?: OrderStatus;       // Статус заказа (по умолчанию PRELIMINARY)
  packages: CreatePackageDto[]; // Упаковки в заказе
}

// DTO для обновления производственного заказа
export interface UpdateProductionOrderDto {
  batchNumber?: string;       // Номер производственной партии
  orderName?: string;         // Название заказа
  requiredDate?: string;      // Требуемая дата выполнения
  status?: OrderStatus;       // Статус заказа
  launchPermission?: boolean; // Разрешение запуска в производство
  isCompleted?: boolean;      // Флаг завершенности
  packages?: CreatePackageDto[]; // Упаковки в заказе (полностью заменит существующие)
}

// DTO для изменения статуса заказа
export interface UpdateOrderStatusDto {
  status: OrderStatus;        // Новый статус заказа
}

// Ответ с деталями в упаковке
export interface PackageDetailResponseDto {
  partId: number;             // ID детали
  partCode: string;           // Код детали
  partName: string;           // Название детали
  quantityPerPackage: number; // Количество в 1 упаковке
  totalQuantity: number;      // Общее количество в заказе
}

// Ответ с данными упаковки
export interface PackageResponseDto {
  packageId: number;              // ID упаковки
  packageCode: string;            // Код упаковки
  packageName: string;            // Название упаковки
  completionPercentage: number;   // Процент готовности упаковки
  quantity: number;               // Количество упаковок в заказе
  details?: PackageDetailResponseDto[]; // Детали в упаковке
}

// Ответ с данными производственного заказа
export interface ProductionOrderResponseDto {
  orderId: number;                    // ID заказа
  batchNumber: string;                // Номер производственной партии
  orderName: string;                  // Название заказа
  completionPercentage: number;       // Процент выполнения заказа
  createdAt: string;                  // Дата создания (ISO 8601)
  completedAt?: string;               // Дата завершения (ISO 8601)
  requiredDate: string;               // Требуемая дата выполнения (ISO 8601)
  status: OrderStatus;                // Статус заказа
  launchPermission: boolean;          // Разрешение запуска в производство
  isCompleted: boolean;               // Флаг завершенности
  packages?: PackageResponseDto[];    // Упаковки в заказе
}

// Ответ при удалении заказа
export interface DeleteProductionOrderResponse {
  message: string;
}

// Детали в упаковке из справочника
export interface PackageDirectoryDetailDto {
  detailId: number;             // ID детали
  partSku: string;              // Артикул детали
  partName: string;             // Название детали
  quantity: number;             // Количество деталей в упаковке
}

// Ответ с данными упаковки из справочника
export interface PackageDirectoryResponseDto {
  packageId: number;              // ID упаковки в справочнике
  packageCode: string;            // Код упаковки
  packageName: string;            // Название упаковки
  detailsCount: number;           // Количество деталей в упаковке
  details?: PackageDirectoryDetailDto[]; // Детали в упаковке из справочника
  createdAt: string;             // Дата создания
  updatedAt: string;             // Дата обновления
}

/**
 * Сервис для работы с API производственных заказов
 */
export const productionOrdersApi = {
  /**
   * Создание нового производственного заказа
   * @param createDto - Данные для создания заказа
   * @returns Promise с созданным заказом
   */
  create: async (createDto: CreateProductionOrderDto): Promise<ProductionOrderResponseDto> => {
    try {
      console.log('Создание нового производственного заказа:', createDto);
      const response = await axios.post<ProductionOrderResponseDto>(`${API_URL}/production-orders`, createDto);
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании производственного заказа:', error);
      throw error;
    }
  },

  /**
   * Получение всех производственных заказов
   * @param status - Опциональный фильтр по статусу
   * @returns Promise с массивом заказов
   */
  findAll: async (status?: OrderStatus): Promise<ProductionOrderResponseDto[]> => {
    try {
      console.log('Получение всех производственных заказов', status ? `со статусом ${status}` : '');
      const params = status ? { status } : {};
      const response = await axios.get<ProductionOrderResponseDto[]>(`${API_URL}/production-orders`, { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении производственных заказов:', error);
      throw error;
    }
  },

  /**
   * Получение производственного заказа по ID
   * @param id - Идентификатор заказа
   * @returns Promise с данными заказа
   */
  findById: async (id: number): Promise<ProductionOrderResponseDto> => {
    try {
      console.log(`Получение производственного заказа с ID=${id}`);
      const response = await axios.get<ProductionOrderResponseDto>(`${API_URL}/production-orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении производственного заказа:', error);
      throw error;
    }
  },

  /**
   * Обновление производственного заказа по ID
   * @param id - Идентификатор заказа
   * @param updateDto - Данные для обновления
   * @returns Promise с обновленным заказом
   */
  update: async (id: number, updateDto: UpdateProductionOrderDto): Promise<ProductionOrderResponseDto> => {
    try {
      console.log(`Обновление производственного заказа с ID=${id}:`, updateDto);
      const response = await axios.patch<ProductionOrderResponseDto>(`${API_URL}/production-orders/${id}`, updateDto);
      return response.data;
    } catch (error) {
      console.error('Ошибка при обновлении производственного заказа:', error);
      throw error;
    }
  },

  /**
   * Изменение статуса производственного заказа
   * @param id - Идентификатор заказа
   * @param statusDto - Новый статус
   * @returns Promise с обновленным заказом
   */
  updateStatus: async (id: number, statusDto: UpdateOrderStatusDto): Promise<ProductionOrderResponseDto> => {
    try {
      console.log(`Изменение статуса производственного заказа с ID=${id} на ${statusDto.status}`);
      const response = await axios.patch<ProductionOrderResponseDto>(`${API_URL}/production-orders/${id}/status`, statusDto);
      return response.data;
    } catch (error) {
      console.error('Ошибка при изменении статуса производственного заказа:', error);
      throw error;
    }
  },

  /**
   * Удаление производственного заказа по ID
   * @param id - Идентификатор заказа
   * @returns Promise с результатом удаления
   */
  remove: async (id: number): Promise<DeleteProductionOrderResponse> => {
    try {
      console.log(`Удаление производственного заказа с ID=${id}`);
      const response = await axios.delete<DeleteProductionOrderResponse>(`${API_URL}/production-orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при удалении производственного заказа:', error);
      throw error;
    }
  },

  /**
   * Получение списка упаковок из справочника
   * @returns Promise с массивом упаковок из справочника
   */
  getPackageDirectory: async (): Promise<PackageDirectoryResponseDto[]> => {
    try {
      console.log('Получение списка упаковок из справочника');
      const response = await axios.get<PackageDirectoryResponseDto[]>(`${API_URL}/package-directory`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении списка упаковок:', error);
      throw error;
    }
  },

  /**
   * Создание новой упаковки в справочнике
   * @param dto - DTO с данными для создания упаковки
   * @returns Promise с данными созданной упаковки
   */
  createPackage: async (dto: CreatePackageDirectoryDto): Promise<PackageDirectoryResponseDto> => {
    try {
      console.log('Создание новой упаковки:', dto);
      const response = await axios.post<PackageDirectoryResponseDto>(`${API_URL}/package-directory`, dto);
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании упаковки:', error);
      throw error;
    }
  },

  /**
   * Обновление упаковки в справочнике
   * @param id - Идентификатор упаковки
   * @param dto - Данные для обновления
   * @returns Promise с обновленной упаковкой
   */
  updatePackage: async (id: number, dto: UpdatePackageDirectoryDto): Promise<PackageDirectoryResponseDto> => {
    try {
      console.log(`Обновление упаковки с ID=${id}:`, dto);
      const response = await axios.patch<PackageDirectoryResponseDto>(`${API_URL}/package-directory/${id}`, dto);
      return response.data;
    } catch (error) {
      console.error('Ошибка при обновлении упаковки:', error);
      throw error;
    }
  },

  /**
   * Удаление упаковки из справочника
   * @param id - Идентификатор упаковки
   * @returns Promise с результатом удаления
   */
  deletePackage: async (id: number): Promise<void> => {
    try {
      console.log(`Удаление упаковки с ID=${id}`);
      await axios.delete(`${API_URL}/package-directory/${id}`);
    } catch (error) {
      console.error('Ошибка при удалении упаковки:', error);
      throw error;
    }
  }
};
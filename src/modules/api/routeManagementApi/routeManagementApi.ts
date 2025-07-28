import axios from 'axios';
import { API_URL } from '../config';

// Статусы заказов для управления маршрутами
export enum OrderStatusForRoutes {
  PRELIMINARY = 'PRELIMINARY',
  APPROVED = 'APPROVED'
}

// DTO для информации о маршруте
export interface RouteInfoDto {
  routeId: number;
  routeName: string;
  stages: {
    routeStageId: number;
    stageName: string;
    substageName?: string;
    sequenceNumber: number;
  }[];
}

// DTO для информации об упаковке
export interface PackageInfo {
  packageId: number;
  packageCode: string;
  packageName: string;
  quantity: number;
}

// DTO для детали в управлении маршрутами
export interface PartForRouteManagementDto {
  partId: number;
  partCode: string;
  partName: string;
  totalQuantity: number;
  status: string;
  currentRoute: RouteInfoDto;
  size: string;
  materialName: string;
  packages: PackageInfo[];
}

// DTO для заказа в управлении маршрутами
export interface OrderForRoutesResponseDto {
  orderId: number;
  batchNumber: string;
  orderName: string;
  status: OrderStatusForRoutes;
  requiredDate: string;
  createdAt: string;
  totalParts: number;
}

// DTO для получения деталей заказа
export interface OrderPartsResponseDto {
  order: {
    orderId: number;
    batchNumber: string;
    orderName: string;
    status: OrderStatusForRoutes;
    requiredDate: string;
  };
  parts: PartForRouteManagementDto[];
  availableRoutes: RouteInfoDto[];
}

// DTO для изменения маршрута детали
export interface UpdatePartRouteDto {
  routeId: number;
}

// DTO для ответа при изменении маршрута
export interface UpdatePartRouteResponseDto {
  partId: number;
  partCode: string;
  partName: string;
  previousRoute: RouteInfoDto;
  newRoute: RouteInfoDto;
  updatedAt: string;
  message: string;
}

/**
 * Сервис для работы с API управления маршрутами
 */
export const routeManagementApi = {
  /**
   * Получение всех доступных маршрутов
   * @returns Promise с массивом марш��утов
   */
  getRoutes: async (): Promise<RouteInfoDto[]> => {
    try {
      console.log('Получение всех доступных маршрутов...');
      const response = await axios.get<RouteInfoDto[]>(`${API_URL}/route-management/routes`);
      console.log('Получены маршруты:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении маршрутов:', error);
      throw error;
    }
  },

  /**
   * Получение заказов для управления маршрутами
   * @returns Promise с массивом заказов
   */
  getOrders: async (): Promise<OrderForRoutesResponseDto[]> => {
    try {
      console.log('Получение заказов для управления маршрутами...');
      const response = await axios.get<OrderForRoutesResponseDto[]>(`${API_URL}/route-management/orders`);
      console.log('Получены заказы:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении заказов:', error);
      throw error;
    }
  },

  /**
   * Получение деталей заказа
   * @param orderId - ID заказа
   * @returns Promise с данными о деталях заказа
   */
  getOrderParts: async (orderId: number): Promise<OrderPartsResponseDto> => {
    try {
      console.log(`Получение деталей заказа с ID=${orderId}...`);
      const response = await axios.get<OrderPartsResponseDto>(`${API_URL}/route-management/orders/${orderId}/parts`);
      console.log('Получены детали заказа:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении деталей заказа:', error);
      throw error;
    }
  },

  /**
   * Изменение маршрута детали
   * @param partId - ID детали
   * @param updateDto - Данные для обновления маршрута
   * @returns Promise с результатом изменения
   */
  updatePartRoute: async (partId: number, updateDto: UpdatePartRouteDto): Promise<UpdatePartRouteResponseDto> => {
    try {
      console.log(`Изменение маршрута детали с ID=${partId}:`, updateDto);
      const response = await axios.patch<UpdatePartRouteResponseDto>(
        `${API_URL}/route-management/parts/${partId}/route`, 
        updateDto
      );
      console.log('Маршрут детали изменен:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при изменении маршрута детали:', error);
      throw error;
    }
  }
};
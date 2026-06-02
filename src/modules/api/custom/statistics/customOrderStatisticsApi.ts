import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Интерфейс для базовой статистики заказа индивидуального производства
 */
export interface CustomOrderStatistics {
  customOrderId: number;
  orderNumber: string;
  orderName: string;
  status: string;
  completionPercentage: number;
  productionProgress: number;
  packingProgress: number;
  createdAt: string;
  requiredDate: string;
  // Алиасы для совместимости с компонентами
  orderId?: number;
  batchNumber?: string;
}

/**
 * Интерфейс для этапа маршрута в поддоне
 */
export interface PalletStage {
  routeStageId: number;
  stageName: string;
  sequenceNumber: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

/**
 * Интерфейс для поддона в статистике
 */
export interface CustomStatisticsPallet {
  palletId: number;
  palletName: string;
  quantity: number;
  stages: PalletStage[];
}

/**
 * Интерфейс для этапа детали
 */
export interface CustomPartStage {
  routeStageId: number;
  stageName: string;
  sequenceNumber: number;
  completionPercentage: number;
  finalStage: boolean;
}

/**
 * Интерфейс для детали заказа
 */
export interface CustomOrderPart {
  customPartId: number;
  partCode: string;
  partName: string;
  totalQuantity: number;
  pallets: CustomStatisticsPallet[];
  stages: CustomPartStage[];
  totalDefected: number;
  totalReturned: number;
}

/**
 * Интерфейс для детальной статистики заказа
 */
export interface CustomOrderDetailedStatistics extends CustomOrderStatistics {
  parts: CustomOrderPart[];
}

/**
 * Интерфейс для ответа при принудительном завершении заказа
 */
export interface ForceCompleteResponse {
  customOrderId: number;
  status: string;
  completedAt: string;
}

/**
 * API для работы со статистикой заказов индивидуального производства
 */
export const customOrderStatisticsApi = {
  /**
   * Получить список всех заказов со статистикой
   * GET /custom-order-statistics
   */
  getAllOrders: async (): Promise<CustomOrderStatistics[]> => {
    const response = await axios.get<CustomOrderStatistics[]>(`${API_URL}/custom-order-statistics`);
    // Добавляем алиасы для совместимости
    return response.data.map((order: CustomOrderStatistics) => ({
      ...order,
      orderId: order.customOrderId,
      batchNumber: order.orderNumber,
    }));
  },

  /**
   * Получить детальную статистику по заказу
   * GET /custom-order-statistics/:id
   */
  getOrderDetails: async (id: number): Promise<CustomOrderDetailedStatistics> => {
    const response = await axios.get<CustomOrderDetailedStatistics>(
      `${API_URL}/custom-order-statistics/${id}`
    );
    // Добавляем алиасы для совместимости
    return {
      ...response.data,
      orderId: response.data.customOrderId,
      batchNumber: response.data.orderNumber,
    };
  },

  /**
   * Принудительно завершить заказ
   * PATCH /custom-order-statistics/:id/force-complete
   */
  forceCompleteOrder: async (id: number): Promise<ForceCompleteResponse> => {
    const response = await axios.patch<ForceCompleteResponse>(
      `${API_URL}/custom-order-statistics/${id}/force-complete`
    );
    return response.data;
  },
};

export default customOrderStatisticsApi;

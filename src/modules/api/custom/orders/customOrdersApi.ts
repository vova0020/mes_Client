import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface CustomOrder {
  id: number;
  orderNumber: string;
  orderName: string;
  completionPercentage: number;
  status: string;
  priority: number;
  available: number;
  completed: number;
}

export interface CustomOrderDetails {
  customOrderId: number;
  orderNumber: string;
  orderName: string;
  completionPercentage: number;
  createdAt: string;
  requiredDate: string;
  status: string;
  priority: number;
  customParts: any[];
}

export const customOrdersApi = {
  getOrdersByStage: async (stageId: number): Promise<CustomOrder[]> => {
    const response = await axios.get(`${API_URL}/custom-orders`, {
      params: { stageId }
    });
    return response.data;
  },

  getOrderById: async (orderId: number): Promise<CustomOrderDetails> => {
    const response = await axios.get(`${API_URL}/custom-orders/${orderId}`);
    return response.data;
  }
};

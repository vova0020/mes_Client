// src/modules/api/orderService.ts
import axios from 'axios';
import { API_URL } from '../config';

// Интерфейс заказа (расширьте при необходимости)
export interface Order {
  id: number;
  batchNumber: string;
  orderName: string;
  completionPercentage: number;
  isCompleted: boolean;
  // добавьте дополнительные поля, если нужно
}

// Получение всех заказов (GET)
export const getAllOrders = async (): Promise<Order[]> => {
  const response = await axios.get(`${API_URL}/orders`);
  return response.data;
};

// Получение заказа по идентификатору (GET)
export const getOrderById = async (id: number): Promise<Order> => {
  const response = await axios.get(`${API_URL}/orders/${id}`);
  return response.data;
};


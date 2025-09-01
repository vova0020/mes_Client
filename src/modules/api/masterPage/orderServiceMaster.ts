// src/modules/api/orderService.ts
import axios from 'axios';
import { API_URL } from '../config';

// Интерфейс заказа
export interface Order {
  id: number;
  batchNumber: string;
  orderName: string;
  completionPercentage: number;
  isCompleted: boolean;
  status: string;
  available: number;
  completed: number;
  priority?: number;
}

// Получение всех заказов (GET)
export const getAllOrders = async (): Promise<Order[]> => {
  // Получаем выбранный этап из localStorage
  const selectedStageString = localStorage.getItem('selectedStage');
  let stageId = null;
  
  if (selectedStageString) {
    try {
      const selectedStage = JSON.parse(selectedStageString);
      stageId = selectedStage.id;
    } catch (error) {
      console.error('Ошибка при парсинге выбранного этапа:', error);
    }
  }
  
  if (!stageId) {
    throw new Error('stageId is required');
  }
  
  const response = await axios.get(`${API_URL}/orders`, {
    params: { stageId }
  });
  return response.data;
}; 

// Получение заказа по идентификатору (GET)
export const getOrderById = async (id: number): Promise<Order> => {
  const response = await axios.get(`${API_URL}/orders/${id}`);
  return response.data;
};

// Создание нового заказа (POST)
export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
  const response = await axios.post(`${API_URL}/orders`, orderData);
  return response.data;
};

// Обновление заказа (PUT)
export const updateOrder = async (id: number, orderData: Partial<Order>): Promise<Order> => {
  const response = await axios.put(`${API_URL}/orders/${id}`, orderData);
  return response.data;
};

// Удаление заказа (DELETE)
export const deleteOrder = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/orders/${id}`);
};
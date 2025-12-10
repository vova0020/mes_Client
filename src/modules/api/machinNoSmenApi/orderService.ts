// src/modules/api/orderService.ts
import axios from 'axios';
import { API_URL } from '../config';

// Интерфейс заказа (расширьте при необходимости)
export interface Order {
  id: number;
  batchNumber: string;
  orderName: string;
  completionPercentage: number;
    available: number;
  completed: number;
  priority?: number;
  // добавьте дополнительные поля, если нужно
}


// Получение всех заказов (GET)
export const getAllOrders = async (): Promise<Order[]> => {
  const stageId = localStorage.getItem('selectedMachineStageId');
  
  if (!stageId) {
    throw new Error('stageId is required');
  }
  
  const response = await axios.get(`${API_URL}/orders`, {
    params: { stageId: Number(stageId) }
  });
  return response.data;
}; 

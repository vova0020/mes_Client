// src/modules/api/orderService.ts
import axios from 'axios';
import { API_URL } from '../config';

// Интерфейс заказа (расширьте при необходимости)
export interface Order {
  id: number;
  batchNumber: string;
  orderName: string;
  completionPercentage: number;
  // добавьте дополнительные поля, если нужно
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
  
  // Добавляем stageId в параметры запроса, если он есть
  const params = stageId ? { stageId } : {};
  const response = await axios.get(`${API_URL}/orders`);
  return response.data;
}; 
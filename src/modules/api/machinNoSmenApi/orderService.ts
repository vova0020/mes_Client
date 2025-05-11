// src/modules/api/orderService.ts
import axios from 'axios';
import { API_URL } from '../config';

// Интерфейс заказа (расширьте при необходимости)
export interface Order {
  id: number;
  runNumber: string;
  name: string;
  progress: number;
  // добавьте дополнительные поля, если нужно
}


/**
 * Получает ID сегмента из localStorage
 * @returns ID сегмента или null, если не удалось получить
 */
const getSegmentIdFromStorage = (): number | null => {
  try {
    const assignmentsData = localStorage.getItem('assignments');
    if (!assignmentsData) {
      console.error('Отсутствуют данные assignments в localStorage');
      return null;
    }
    
    const parsedData = JSON.parse(assignmentsData);
    if (!parsedData.machines || parsedData.machines.length === 0) {
      console.error('Нет данных assignments отсутствуют segments');
      return null;
    }
    
    return parsedData.machines[0].segmentId;
  } catch (error) {
    console.error('Ошибка при получении segmentId из localStorage:', error);
    return null;
  }
};

// Получение  заказов (GET)
export const getAllOrders = async (): Promise<Order[]> => {
  const segmentId = getSegmentIdFromStorage();
    
    if (segmentId === null) {
      console.error('Не удалось получить ID сегмента из localStorage');
      throw new Error('Не удалось получить ID сегмента из localStorage');
    }
  const response = await axios.get(`${API_URL}/machines-no-shifts/segment/orders`, {
      params: {
        segmentId: segmentId
      }
    });
    
  return response.data.orders;
};

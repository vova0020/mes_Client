import axios from 'axios';
import { API_URL } from '../config';

// Определение интерфейса детали
export interface Detail {
  id: number;
  article: string;
  name: string;
  material: string;
  size: string;
  totalNumber: number;
  readyForProcessing: number;
  distributed: number;
  completed: number;
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

// Функция для получения деталей по ID заказа
export const fetchDetailsByOrderId = async (orderId: number | null): Promise<Detail[]> => {
  if (orderId === null) {
    return [];
  }
  const segmentId = getSegmentIdFromStorage();
    
    if (segmentId === null) {
      console.error('Не удалось получить ID сегмента из localStorage');
      throw new Error('Не удалось получить ID сегмента из localStorage');
    }
  try {
    const response = await axios.get(`${API_URL}/machines-no-shifts/order/details`, {
      params: {
        orderId: orderId,
        segmentId: segmentId
      }
    });
    return response.data.details;
  } catch (error) {
    console.error('Ошибка при получении деталей:', error);
    throw error;
  }
};
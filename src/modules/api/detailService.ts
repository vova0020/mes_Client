import axios from 'axios';
import { API_URL } from './config';

// Определение интерфейса детали
export interface Detail {
  id: number;
  articleNumber: string;
  name: string;
  material: string;
  size: string;
  totalQuantity: number;
  readyForProcessing: number;
  distributed: number;
  completed: number;
}

// Функция для получения деталей по ID заказа
export const fetchDetailsByOrderId = async (orderId: number | null): Promise<Detail[]> => {
  if (orderId === null) {
    return [];
  }
  
  try {
    const response = await axios.get(`${API_URL}/details/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении деталей:', error);
    throw error;
  }
};
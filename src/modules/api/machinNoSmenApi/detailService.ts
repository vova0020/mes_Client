import axios from 'axios';
import { API_URL } from '../config';

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

const getSegmentIdFromStorage = (): number | null => {
  try {
    const assignmentsData = localStorage.getItem('selectedStage');
    if (!assignmentsData) {
      console.error('Отсутствуют данные assignments в localStorage');
      return null;
    }
    
    const parsedData = JSON.parse(assignmentsData);
    if (!parsedData || parsedData.length === 0) {
      console.error('Нет данных assignments отсутствуют stages');
      return null;
    }
    
    return parsedData.id;
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
  
  try {
    const response = await axios.get(`${API_URL}/machines/noSmen/${orderId}/segment/${segmentId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении деталей:', error);
    throw error;
  }
};
// src/modules/api/orderService.ts
import axios from 'axios';
import { API_URL } from '../config';



const getMachineIdFromStorage = (): number | null => {
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
    
    return parsedData.machines[0].id;
  } catch (error) {
    console.error('Ошибка при получении machineId из localStorage:', error);
    return null;
  }
};

const getStageIdFromStorage = (): number | null => {
  try {
    const stageId = localStorage.getItem('selectedMachineStageId');
    return stageId ? Number(stageId) : null;
  } catch (error) {
    console.error('Ошибка при получении stageId из localStorage:', error);
    return null;
  }
};

export const getSmenOrders = async () => {
  const machineId = getMachineIdFromStorage();
    
  if (machineId === null) {
    console.error('Не удалось получить ID станка из localStorage');
    throw new Error('Не удалось получить ID станка из localStorage');
  }

  const stageId = getStageIdFromStorage();
  
  if (stageId === null) {
    console.error('Не удалось получить ID этапа из localStorage');
    throw new Error('Не удалось получить ID этапа из localStorage');
  }

  const response = await axios.get(`${API_URL}/machines/${machineId}/task`, {
    params: { stageId }
  });
    
  return response.data;
};

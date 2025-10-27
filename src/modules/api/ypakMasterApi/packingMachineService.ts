import axios from "axios";
import { API_URL } from "../config";

/**
 * Сбрасывает счетчик выполненных операций для станка
 * @param machineId ID станка
 * @returns Сообщение об успешном сбросе
 */
export const resetMachineCounter = async (machineId: number): Promise<{ message: string }> => {
  try {
    const response = await axios.post<{ message: string }>(
      `${API_URL}/machins/master/machine/${machineId}/reset-counter`
    );
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка при сбросе счетчика для станка ${machineId}:`, error);
    throw error;
  }
};
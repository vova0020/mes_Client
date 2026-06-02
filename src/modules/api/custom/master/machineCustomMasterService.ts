import { API_URL } from '../../config';

export const resetMachineCounter = async (machineId: number): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/custom/master/machines/${machineId}/reset-counter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Ошибка при сбросе счетчика станка');
  }

  return response.json();
};

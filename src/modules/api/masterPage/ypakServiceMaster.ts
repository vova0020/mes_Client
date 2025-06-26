import axios from 'axios';
import { API_URL } from '../config';

// Интерфейс для одного элемента
export interface PackagingDataDto {
  id: number;
  orderId: number;
  packageCode: string;
  packageName: string;
  quantity: number;
  completionPercentage: number;
}
// Интерфейс для обёртки ответа
interface PackagingListDto {
  packages: PackagingDataDto[];
}

// Функция для получения списка упаковок по orderId через query-параметр
export const fetchPackagingByOrderId = async (
  orderId: number | null,
): Promise<PackagingDataDto[]> => {
  if (orderId === null) {
    return [];
  }

  try {
    // Делаем GET /packaging-products?orderId=123
    const response = await axios.get<PackagingListDto>(
      `${API_URL}/packaging-products`,
      {
        params: { orderId },
      },
    );

    // Если бек возвращает сразу массив DTO, используем response.data напрямую:
    return response.data.packages;

  } catch (error) {
    console.error('Ошибка при получении данных об упаковках:', error);
    throw error;
  }
};


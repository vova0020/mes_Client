import { useState, useEffect, useCallback } from 'react';
import { 
  productionOrdersApi, 
  PackageDirectoryResponseDto
} from '../../api/productionOrdersApi/productionOrdersApi';

// Типы состояний загрузки
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// DTO для создания упаковки (пока что простой интерфейс)
interface CreatePackageDto {
  packageCode: string;
  packageName: string;
}

// Тип для результата хука
interface UsePackageDirectoryResult {
  packages: PackageDirectoryResponseDto[];
  loading: LoadingState;
  error: Error | null;
  selectedPackage: PackageDirectoryResponseDto | null;
  
  // Операции
  fetchPackages: () => Promise<void>;
  createPackage: (createDto: CreatePackageDto) => Promise<void>;
  selectPackage: (packageId: number | null) => void;
  clearSelection: () => void;
  
  // Состояния операций
  isFetching: boolean;
  isCreating: boolean;
}

/**
 * Хук для работы со справочником упаковок
 * @param autoFetch - Автоматически загружать данные при инициализации (по умолчанию true)
 * @returns ��бъект с данными и методами для работы со справочником упаковок
 */
export const usePackageDirectory = (
  autoFetch: boolean = true
): UsePackageDirectoryResult => {
  const [packages, setPackages] = useState<PackageDirectoryResponseDto[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageDirectoryResponseDto | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Функция для загрузки всех упаковок из справочника
  const fetchPackages = useCallback(async (): Promise<void> => {
    try {
      setLoading('loading');
      setIsFetching(true);
      setError(null);
      
      console.log('Загрузка списка упаковок из справочника...');
      const data = await productionOrdersApi.getPackageDirectory();
      console.log('Получены упаковки из справочника:', data);
      
      setPackages(data);
      setLoading('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке упаковок');
      setError(error);
      setLoading('error');
      console.error('Ошибка при загрузке упаковок из справочника:', error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Функция для выбора упаковки
  const selectPackage = useCallback((packageId: number | null) => {
    if (packageId === null) {
      setSelectedPackage(null);
      return;
    }
    
    const pkg = packages.find(p => p.packageId === packageId);
    if (pkg) {
      setSelectedPackage(pkg);
      console.log('Выбрана упаковка из справочника:', pkg);
    } else {
      console.warn(`Упаковка с ID=${packageId} не найдена в справочнике`);
    }
  }, [packages]);

  // Функция для создания новой упаковки (заглушка, так как API для создания упаковок пока не реализован)
  const createPackage = useCallback(async (createDto: CreatePackageDto): Promise<void> => {
    try {
      setIsCreating(true);
      setError(null);
      
      console.log('Создание новой упаковки:', createDto);
      
      // TODO: Здесь должен быть вызов API для создания упаковки
      // Пока что это заглушка
      console.warn('API для создания упаковок пока не реализован');
      
      // Имитируем задержку
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // После создания перезагружаем список упаковок
      await fetchPackages();
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при создании упаковки');
      setError(error);
      console.error('Ошибка при создании упаковки:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [fetchPackages]);

  // Функция для сброса выбора
  const clearSelection = useCallback(() => {
    setSelectedPackage(null);
    console.log('Выбор упаковки из справочника сброшен');
  }, []);

  // Автоматическая загрузка данных при инициализации
  useEffect(() => {
    if (autoFetch) {
      fetchPackages();
    }
  }, [autoFetch, fetchPackages]);

  return {
    packages,
    loading,
    error,
    selectedPackage,
    
    // Операции
    fetchPackages,
    createPackage,
    selectPackage,
    clearSelection,
    
    // Состояния операций
    isFetching,
    isCreating
  };
};
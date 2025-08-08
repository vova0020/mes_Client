import { useState, useCallback, useEffect } from 'react';
import { 
  productionOrdersApi, 
  PackageDirectoryResponseDto,
  UpdatePackageDirectoryDto
} from '../../api/productionOrdersApi/productionOrdersApi';

// DTO для создания упаковки в справочнике
interface CreatePackageDirectoryDto {
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
  createPackage: (createDto: CreatePackageDirectoryDto) => Promise<void>;
  updatePackage: (packageId: number, updateDto: UpdatePackageDirectoryDto) => Promise<void>;
  deletePackage: (packageId: number) => Promise<void>;
  selectPackage: (packageId: number | null) => void;
  clearSelection: () => void;
  
  // Состояния операций
  isFetching: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
};

// Типы состояний загрузки
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Тип для результата хука
interface UsePackageDirectoryResult {
  packages: PackageDirectoryResponseDto[];
  loading: LoadingState;
  error: Error | null;
  selectedPackage: PackageDirectoryResponseDto | null;
  
  // Операции
  fetchPackages: () => Promise<void>;
  createPackage: (createDto: CreatePackageDirectoryDto) => Promise<void>;
  deletePackage: (packageId: number) => Promise<void>;
  selectPackage: (packageId: number | null) => void;
  clearSelection: () => void;
  
  // Состояния операций
  isFetching: boolean;
  isCreating: boolean;
  isDeleting: boolean;
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const createPackage = useCallback(async (createDto: CreatePackageDirectoryDto): Promise<void> => {
    try {
      setIsCreating(true);
      setError(null);
      
      console.log('Создание новой упаковки:', createDto);
      
      // Вызываем API для создания упаковки
      await productionOrdersApi.createPackage({
        packageCode: createDto.packageCode,
        packageName: createDto.packageName
      });
      
      // После успешного создания обновляем список упаковок
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

  // Функция для обновления упаковки
  const updatePackage = useCallback(async (packageId: number, updateDto: UpdatePackageDirectoryDto): Promise<void> => {
    try {
      setIsUpdating(true);
      setError(null);
      
      console.log('Обновление упаковки:', packageId, updateDto);
      
      // Вызываем API для обновления упаковки
      await productionOrdersApi.updatePackage(packageId, updateDto);
      
      // После успешного обновления обновляем список упаковок
      await fetchPackages();
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при обновлении упаковки');
      setError(error);
      console.error('Ошибка при обновлении упаковки:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [fetchPackages]);

  // Функция для удаления упаковки
  const deletePackage = useCallback(async (packageId: number): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);
      
      console.log('Удаление упаковки:', packageId);
      
      // Вызываем API для удаления упаковки
      await productionOrdersApi.deletePackage(packageId);
      
      // После успешного удаления обновляем список упаковок
      await fetchPackages();
      
      // Если была выбрана удаленная упаковка, сбрасываем выбор
      if (selectedPackage?.packageId === packageId) {
        clearSelection();
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при удалении упаковки');
      setError(error);
      console.error('Ошибка при удалении упаковки:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [fetchPackages, selectedPackage, clearSelection]);

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
    updatePackage,
    deletePackage,
    selectPackage,
    clearSelection,
    
    // Состояния операций
    isFetching,
    isCreating,
    isUpdating,
    isDeleting
  };
};
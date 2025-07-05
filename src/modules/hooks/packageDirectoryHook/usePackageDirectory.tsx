import { useState, useEffect, useCallback } from 'react';
import { 
  packageDirectoryApi, 
  PackageDirectory, 
  CreatePackageDirectoryDto, 
  UpdatePackageDirectoryDto,
  DeletePackageDirectoryResponse
} from '../../api/packageDirectoryApi/packageDirectoryApi';

// Типы состояний загрузки
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Тип для результата хука
interface UsePackageDirectoryResult {
  packages: PackageDirectory[];
  loading: LoadingState;
  error: Error | null;
  selectedPackage: PackageDirectory | null;
  
  // Операции CRUD
  createPackage: (createDto: CreatePackageDirectoryDto) => Promise<PackageDirectory>;
  updatePackage: (id: number, updateDto: UpdatePackageDirectoryDto) => Promise<PackageDirectory>;
  deletePackage: (id: number) => Promise<void>;
  fetchPackages: () => Promise<void>;
  fetchPackageById: (id: number) => Promise<PackageDirectory>;
  
  // Управление выбранной упаковкой
  selectPackage: (packageId: number | null) => void;
  clearSelection: () => void;
  
  // Состояния операций
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

/**
 * Хук для работы с упаковками
 * @param autoFetch - Автоматически загружать данные при инициализации (по умолчанию true)
 * @returns Объект с данными и методами для работы с упаковками
 */
export const usePackageDirectory = (autoFetch: boolean = true): UsePackageDirectoryResult => {
  const [packages, setPackages] = useState<PackageDirectory[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageDirectory | null>(null);
  
  // Состояния для отдельных операций
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Функция для загрузки всех упаковок
  const fetchPackages = useCallback(async (): Promise<void> => {
    try {
      setLoading('loading');
      setError(null);
      
      console.log('Загрузка списка упаковок...');
      const data = await packageDirectoryApi.findAll();
      console.log('Получены упаковки:', data);
      
      setPackages(data);
      setLoading('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке упаковок');
      setError(error);
      setLoading('error');
      console.error('Ошибка при загрузке упаковок:', error);
    }
  }, []);

  // Функция для получения упаковки по ID
  const fetchPackageById = useCallback(async (id: number): Promise<PackageDirectory> => {
    try {
      console.log(`Загрузка упаковки с ID=${id}...`);
      const data = await packageDirectoryApi.findById(id);
      console.log('Получена упаковка:', data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке упаковки');
      setError(error);
      console.error('Ошибка при загрузке упаковки:', error);
      throw error;
    }
  }, []);

  // Функция для создания новой упаковки
  const createPackage = useCallback(async (createDto: CreatePackageDirectoryDto): Promise<PackageDirectory> => {
    try {
      setIsCreating(true);
      setError(null);
      
      console.log('Создание новой упаковки:', createDto);
      const newPackage = await packageDirectoryApi.create(createDto);
      console.log('Упаковка создана:', newPackage);
      
      // Добавляем новую упаковку в список
      setPackages(prev => [...prev, newPackage]);
      
      return newPackage;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при создании упаковки');
      setError(error);
      console.error('Ошибка при создании упаковки:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Функция для обновления упаковки
  const updatePackage = useCallback(async (id: number, updateDto: UpdatePackageDirectoryDto): Promise<PackageDirectory> => {
    try {
      setIsUpdating(true);
      setError(null);
      
      console.log(`Обновлени�� упаковки с ID=${id}:`, updateDto);
      const updatedPackage = await packageDirectoryApi.update(id, updateDto);
      console.log('Упаковка обновлена:', updatedPackage);
      
      // Обновляем упаковку в списке
      setPackages(prev => prev.map(pkg => pkg.packageId === id ? updatedPackage : pkg));
      
      // Если обновляемая упаковка была выбрана, обновляем и её
      if (selectedPackage?.packageId === id) {
        setSelectedPackage(updatedPackage);
      }
      
      return updatedPackage;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при обновлении упаковки');
      setError(error);
      console.error('Ошибка при обновлении упаковки:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [selectedPackage]);

  // Функция для удаления упаковки
  const deletePackage = useCallback(async (id: number): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);
      
      console.log(`Удаление упаковки с ID=${id}...`);
      const result = await packageDirectoryApi.remove(id);
      console.log('Упаковка удалена:', result.message);
      
      // Удаляем упаковку из списка
      setPackages(prev => prev.filter(pkg => pkg.packageId !== id));
      
      // Если удаляемая упаковка была выбрана, сбрасываем выбор
      if (selectedPackage?.packageId === id) {
        setSelectedPackage(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при удалении упаковки');
      setError(error);
      console.error('Ошибка при удалении упаковки:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [selectedPackage]);

  // Функция для выбора упаковки
  const selectPackage = useCallback((packageId: number | null) => {
    if (packageId === null) {
      setSelectedPackage(null);
      return;
    }
    
    const packageItem = packages.find(pkg => pkg.packageId === packageId);
    if (packageItem) {
      setSelectedPackage(packageItem);
      console.log('Выбрана упаковка:', packageItem);
    } else {
      console.warn(`Упаковка с ID=${packageId} не найдена в списке`);
    }
  }, [packages]);

  // Функция для сброса выбора
  const clearSelection = useCallback(() => {
    setSelectedPackage(null);
    console.log('Выбор упаковки сброшен');
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
    
    // Операции CRUD
    createPackage,
    updatePackage,
    deletePackage,
    fetchPackages,
    fetchPackageById,
    
    // Управление выбранной упаковкой
    selectPackage,
    clearSelection,
    
    // Состояния операций
    isCreating,
    isUpdating,
    isDeleting
  };
};
import { useState, useEffect, useCallback } from 'react';
import { 
  detailsApi, 
  Detail, 
  CreateDetailDto, 
  UpdateDetailDto,
  DeleteDetailResponse,
  CreateDetailWithPackageDto,
  SaveDetailsFromFileDto,
  SaveDetailsFromFileResponse
} from '../../api/detailsApi/detailsApi';

// Типы состояний загрузки
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Тип для результата хука
interface UseDetailsResult {
  details: Detail[];
  loading: LoadingState;
  error: Error | null;
  selectedDetail: Detail | null;
  
  // Операции CRUD
  createDetail: (createDto: CreateDetailDto) => Promise<Detail>;
  createDetailWithPackage: (createDto: CreateDetailWithPackageDto) => Promise<Detail>;
  updateDetail: (id: number, updateDto: UpdateDetailDto) => Promise<Detail>;
  deleteDetail: (id: number) => Promise<void>;
  copyDetail: (id: number) => Promise<Detail>;
  fetchDetailsByPackage: (packageId: number) => Promise<void>;
  saveDetailsFromFile: (saveDto: SaveDetailsFromFileDto) => Promise<SaveDetailsFromFileResponse>;
  
  // Управление выбранной деталью
  selectDetail: (detailId: number | null) => void;
  clearSelection: () => void;
  
  // Состояния операций
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isCopying: boolean;
  
  // Очистка данных
  clearDetails: () => void;
}

/**
 * Хук для работы с деталями
 * @param packageId - ID упаковки для автоматической загрузки деталей (опционально)
 * @returns Объект с данными и методами для работы с деталями
 */
export const useDetails = (packageId?: number): UseDetailsResult => {
  const [details, setDetails] = useState<Detail[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Detail | null>(null);
  
  // Состояния для отдельных операций
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Функция для загрузки деталей по упаковке
  const fetchDetailsByPackage = useCallback(async (packageId: number): Promise<void> => {
    try {
      setLoading('loading');
      setError(null);
      
      console.log(`Загрузка деталей для упаковки с ID=${packageId}...`);
      const data = await detailsApi.getByPackageId(packageId);
      console.log('Получены детали:', data);
      
      setDetails(data);
      setLoading('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке деталей');
      setError(error);
      setLoading('error');
      console.error('Ошибка при загрузке деталей:', error);
    }
  }, []);

  // Функция для создания новой детали
  const createDetail = useCallback(async (createDto: CreateDetailDto): Promise<Detail> => {
    try {
      setIsCreating(true);
      setError(null);
      
      console.log('Создание новой детали:', createDto);
      const newDetail = await detailsApi.create(createDto);
      console.log('Деталь создана:', newDetail);
      
      // Добавляем новую деталь в список
      setDetails(prev => [...prev, newDetail]);
      
      return newDetail;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при создании детали');
      setError(error);
      console.error('Ошибка при создании детали:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Функция для создания новой детали с упаковкой
  const createDetailWithPackage = useCallback(async (createDto: CreateDetailWithPackageDto): Promise<Detail> => {
    try {
      setIsCreating(true);
      setError(null);
      
      console.log('Создание новой детали с упаковкой:', createDto);
      const newDetail = await detailsApi.createWithPackage(createDto);
      console.log('Деталь с упаковкой создана:', newDetail);
      
      // Добавляем новую деталь в список
      setDetails(prev => [...prev, newDetail]);
      
      return newDetail;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при создании детали с упаковкой');
      setError(error);
      console.error('Ошибка при создании детали с упаковкой:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Функция для обновления детали
  const updateDetail = useCallback(async (id: number, updateDto: UpdateDetailDto): Promise<Detail> => {
    try {
      setIsUpdating(true);
      setError(null);
      
      console.log(`Обновление детали с ID=${id}:`, updateDto);
      const updatedDetail = await detailsApi.update(id, updateDto);
      console.log('Деталь обновлена:', updatedDetail);
      
      // Обновляем деталь в списке
      setDetails(prev => prev.map(detail => detail.id === id ? updatedDetail : detail));
      
      // Если обновляемая деталь была выбрана, обновляем и её
      if (selectedDetail?.id === id) {
        setSelectedDetail(updatedDetail);
      }
      
      return updatedDetail;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при обновлении детали');
      setError(error);
      console.error('Ошибка при обновлении детали:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [selectedDetail]);

  // Функция для удаления детали
  const deleteDetail = useCallback(async (id: number): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);
      
      console.log(`Удаление детали с ID=${id}...`);
      const result = await detailsApi.remove(id);
      console.log('Деталь удалена:', result.message);
      
      // Удаляем деталь из списка
      setDetails(prev => prev.filter(detail => detail.id !== id));
      
      // Если удаляемая деталь была выбрана, сбрасываем выбор
      if (selectedDetail?.id === id) {
        setSelectedDetail(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при удалении детали');
      setError(error);
      console.error('Ошибка при удалении детали:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [selectedDetail]);

  // Функция для копирования детали
  const copyDetail = useCallback(async (id: number): Promise<Detail> => {
    try {
      setIsCopying(true);
      setError(null);
      
      console.log(`Копирование детали с ID=${id}...`);
      const copiedDetail = await detailsApi.copy(id);
      console.log('Деталь скопирована:', copiedDetail);
      
      // Добавляем скопированную деталь в список
      setDetails(prev => [...prev, copiedDetail]);
      
      return copiedDetail;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при копировании детали');
      setError(error);
      console.error('Ошибка при копировании детали:', error);
      throw error;
    } finally {
      setIsCopying(false);
    }
  }, []);

  // Функция для выбора детали
  const selectDetail = useCallback((detailId: number | null) => {
    if (detailId === null) {
      setSelectedDetail(null);
      return;
    }
    
    const detail = details.find(d => d.id === detailId);
    if (detail) {
      setSelectedDetail(detail);
      console.log('Выбрана деталь:', detail);
    } else {
      console.warn(`Деталь с ID=${detailId} не найдена в списке`);
    }
  }, [details]);

  // Функция для сброса выбора
  const clearSelection = useCallback(() => {
    setSelectedDetail(null);
    console.log('Выбор детали сброшен');
  }, []);

  // Функция для очистки списка деталей
  const clearDetails = useCallback(() => {
    setDetails([]);
    setSelectedDetail(null);
    setLoading('idle');
    setError(null);
    console.log('Список деталей очищен');
  }, []);

  // Функция для сохранения деталей из файла
  const saveDetailsFromFile = useCallback(async (saveDto: SaveDetailsFromFileDto): Promise<SaveDetailsFromFileResponse> => {
    try {
      setIsCreating(true);
      setError(null);
      
      console.log('Сохранение деталей из файла:', saveDto);
      const result = await detailsApi.saveFromFile(saveDto);
      console.log('Детали из файла сохранены:', result);
      
      // Перезагружаем детали для текущей упаковки
      if (saveDto.packageId) {
        await fetchDetailsByPackage(saveDto.packageId);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при сохранении деталей из файла');
      setError(error);
      console.error('Ошибка при сохранении деталей из файла:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [fetchDetailsByPackage]);

  // Автоматическая загрузка данных при изменении packageId
  useEffect(() => {
    if (packageId) {
      fetchDetailsByPackage(packageId);
    } else {
      clearDetails();
    }
  }, [packageId, fetchDetailsByPackage, clearDetails]);

  return {
    details,
    loading,
    error,
    selectedDetail,
    
    // Операции CRUD
    createDetail,
    createDetailWithPackage,
    updateDetail,
    deleteDetail,
    copyDetail,
    fetchDetailsByPackage,
    saveDetailsFromFile,
    
    // Управление выбранной деталью
    selectDetail,
    clearSelection,
    
    // Состояния операций
    isCreating,
    isUpdating,
    isDeleting,
    isCopying,
    
    // Очистка данных
    clearDetails
  };
};
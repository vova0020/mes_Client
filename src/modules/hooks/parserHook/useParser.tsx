import { useState, useCallback } from 'react';
import { 
  parserApi, 
  ParsedDetail, 
  ParseFileResponse 
} from '../../api/parserApi/parserApi';

// Типы состояний загрузки
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Тип для результата хука
interface UseParserResult {
  parsedData: ParsedDetail[];
  loading: LoadingState;
  error: Error | null;
  filename: string | null;
  
  // Операции
  uploadFile: (file: File, packageId?: number, quantity?: number) => Promise<ParseFileResponse>;
  clearData: () => void;
  clearAfterSave: () => void;
  
  // Состояния операций
  isUploading: boolean;
}

/**
 * Хук для работы с парсером Excel файлов
 * @returns Объект с данными и методами для работы с парсером
 */
export const useParser = (): UseParserResult => {
  const [parsedData, setParsedData] = useState<ParsedDetail[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Функция для загрузки и парсинга файла
  const uploadFile = useCallback(async (file: File, packageId?: number, quantity?: number): Promise<ParseFileResponse> => {
    try {
      setIsUploading(true);
      setLoading('loading');
      setError(null);
      
      console.log('Начинаем парсинг файла:', file.name, { packageId, quantity });
      const response = await parserApi.uploadFile(file, packageId, quantity);
      console.log('Парсинг завершен:', response);
      
      setParsedData(response.data);
      setFilename(response.filename);
      setLoading('success');
      
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при парсинге файла');
      setError(error);
      setLoading('error');
      console.error('Ошибка при парсинге файла:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Функция для очистки данных
  const clearData = useCallback(() => {
    setParsedData([]);
    setFilename(null);
    setLoading('idle');
    setError(null);
    console.log('Данные парсера очищены');
  }, []);

  // Функция для очистки данных после успешного сохранения
  const clearAfterSave = useCallback(() => {
    setParsedData([]);
    setFilename(null);
    setLoading('idle');
    setError(null);
    console.log('Данные парсера очищены после сохранения');
  }, []);

  return {
    parsedData,
    loading,
    error,
    filename,
    
    // Операции
    uploadFile,
    clearData,
    clearAfterSave,
    
    // Состояния операций
    isUploading
  };
};
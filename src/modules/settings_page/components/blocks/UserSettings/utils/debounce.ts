/**
 * Утилита для дебаунса функций
 * @param func - функция для дебаунса
 * @param wait - время задержки в миллисекундах
 * @returns дебаунсированная функция
 */
/**
 * Хук для дебаунса значений
 * @param value - значение для дебаунса
 * @param delay - задержка в миллисекундах
 * @returns дебаунсированное значение
 */
import { useState, useEffect } from 'react';

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

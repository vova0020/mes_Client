import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavbarService, type Stage } from '../../modules/api/navbarApi';

/**
 * Хук для работы с навбаром этапов
 */
export const useStageNavbar = () => {
  const [availableStages, setAvailableStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Загрузка доступных этапов
   */
  const fetchStages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Получаем все этапы из API
      const allStages = await NavbarService.getStages();
      
      // Получаем данные пользователя из localStorage
      const { userData, assignments } = NavbarService.getUserDataFromStorage();
      
      if (!userData || !assignments) {
        throw new Error('Данные пользователя не найдены');
      }
      
      // Фильтруем этапы в зависимости от роли пользователя
      const filteredStages = NavbarService.filterStagesByRole(
        allStages,
        userData.primaryRole,
        assignments.stages
      );
      
      setAvailableStages(filteredStages);
      return filteredStages;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('Ошибка при загрузке этапов:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Выбор этапа и перенаправление
   */
  const selectStage = useCallback((stage: Stage) => {
    console.log('=== ВЫБОР ЭТАПА ===');
    console.log('Выбран этап:', stage);
    console.log('Текущий маршрут:', location.pathname);
    
    // Сохраняем выбранный этап в localStorage
    NavbarService.saveSelectedStage(stage);
    
    // Определяем целевой маршрут в зависимости от типа этапа
    const targetRoute = stage.finalStage ? '/ypak' : '/master';
    
    console.log(`Целевой маршрут: ${targetRoute} (финальный этап: ${stage.finalStage})`);
    
    // Отправляем событие об изменении выбранного этапа ПОСЛЕ сохранения
    window.dispatchEvent(new CustomEvent('stageChanged', { detail: stage }));
    
    // Проверяем, нужно ли перенаправление
    if (location.pathname !== targetRoute) {
      console.log(`Выполняется перенаправление с ${location.pathname} на ${targetRoute}`);
      navigate(targetRoute, { replace: true });
    } else {
      console.log('Уже на нужной странице, перенаправление не требуется');
      // Если мы уже на нужной странице, просто обновляем данные
      // Событие stageChanged уже отправлено выше
    }
    
  }, [navigate, location.pathname]);

  /**
   * Получение текущего выбранного этапа
   */
  const getCurrentStage = useCallback((): Stage | null => {
    return NavbarService.getSelectedStage();
  }, []);

  /**
   * Получение данных пользователя
   */
  const getUserData = useCallback(() => {
    return NavbarService.getUserDataFromStorage();
  }, []);

  return {
    availableStages,
    loading,
    error,
    fetchStages,
    selectStage,
    getCurrentStage,
    getUserData,
  };
};

export default useStageNavbar;
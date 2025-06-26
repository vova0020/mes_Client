import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

interface ProtectedRouteProps {
  requiredRole?: string;
  requiredRoles?: string[];
  requirePrimaryRole?: boolean; // Флаг для проверки основной роли
  requireFinalStage?: boolean; // Флаг для проверки наличия финальных этапов (для мастеров упаковки)
  excludeFinalStage?: boolean; // Флаг для исключения пользователей с финальными этапами (для обычных мастеров)
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredRole, 
  requiredRoles, 
  requirePrimaryRole = false,
  requireFinalStage = false,
  excludeFinalStage = false
}) => {
  console.log('=== PROTECTED ROUTE ===');
  console.log('Props:', { requiredRole, requiredRoles, requirePrimaryRole, requireFinalStage, excludeFinalStage });

  // Проверяем ауте��тификацию
  if (!authService.isAuthenticated()) {
    console.log('Пользователь не аутентифицирован, перенаправление на /login');
    return <Navigate to="/login" replace />;
  }

  const user = authService.getUser();
  
  if (!user) {
    console.log('Нет данных пользователя, перенаправление на /login');
    return <Navigate to="/login" replace />;
  }

  console.log('Пользователь:', user);

  // Функция для перенаправления на домашнюю страницу пользователя с учетом выбранного этапа
  const redirectToHomePage = () => {
    const homePage = authService.determineHomePageWithSelectedStage();
    console.log('Перенаправление на домашнюю страницу:', homePage);
    return <Navigate to={homePage} replace />;
  };

  // Проверка на множественные роли
  if (requiredRoles && requiredRoles.length > 0) {
    let hasAccess = false;

    if (requirePrimaryRole) {
      // Проверяем, является ли основная роль одной из требуемых
      hasAccess = requiredRoles.some(role => 
        authService.isPrimaryRole(role.toLowerCase())
      );
    } else {
      // Проверяем, есть ли у пользователя хотя бы одна из требуемых ролей
      hasAccess = requiredRoles.some(role => 
        authService.hasRole(role.toLowerCase())
      );
    }

    console.log('Проверка множественных ролей:', requiredRoles, 'Доступ:', hasAccess);

    if (!hasAccess) {
      return redirectToHomePage();
    }
  }
  // Проверка на одиночную роль
  else if (requiredRole) {
    let hasAccess = false;

    if (requirePrimaryRole) {
      // Проверяем, является ли указанная роль основной
      hasAccess = authService.isPrimaryRole(requiredRole.toLowerCase());
    } else {
      // Проверяем, есть ли у пользователя указанная роль
      hasAccess = authService.hasRole(requiredRole.toLowerCase());
    }

    console.log('Проверка одиночной роли:', requiredRole, 'Доступ:', hasAccess);

    if (!hasAccess) {
      return redirectToHomePage();
    }
  }

  // Дополнительная проверка для финальных этапов (для мастеров упа��овки)
  if (requireFinalStage) {
    // Проверяем выбранный этап, а не общее наличие финальных этапов
    const selectedStageString = localStorage.getItem('selectedStage');
    let hasAccessToFinalStage = false;
    
    if (selectedStageString) {
      try {
        const selectedStage = JSON.parse(selectedStageString);
        hasAccessToFinalStage = selectedStage.finalStage;
        console.log('Проверка финального этапа. Выбранный этап:', selectedStage, 'Финальный:', hasAccessToFinalStage);
      } catch (error) {
        console.error('Ошибка при парсинге выбранного этапа:', error);
      }
    }
    
    if (!hasAccessToFinalStage) {
      console.log('Нет доступа к финальному этапу, перенаправление');
      return redirectToHomePage();
    }
  }

  // Исключение пользователей с выбранными финальными этапами (для обычных мастеров)
  if (excludeFinalStage) {
    // Проверяем выбранный этап, а не общее наличие финальных этапов
    const selectedStageString = localStorage.getItem('selectedStage');
    if (selectedStageString) {
      try {
        const selectedStage = JSON.parse(selectedStageString);
        console.log('Проверка исключения финального этапа. Выбранный этап:', selectedStage);
        
        // Блокируем доступ к обычной странице, если выбран финальный этап
        if (selectedStage.finalStage && authService.hasRole('master') && !authService.hasRole('admin')) {
          console.log('Выбран финальный этап, но пытается зайти на обычную страницу, перенаправление');
          return redirectToHomePage();
        }
      } catch (error) {
        console.error('Ошибка при парсинге выбранного этапа в ProtectedRoute:', error);
      }
    }
  }

  console.log('Все проверки пройдены, доступ разрешен');
  // Если прошли все проверки, разрешаем доступ к дочерним маршрутам
  return <Outlet />;
};

export default ProtectedRoute;
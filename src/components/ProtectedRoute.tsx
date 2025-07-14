import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

interface ProtectedRouteProps {
  requiredRole?: string;
  requiredRoles?: string[];
  requirePrimaryRole?: boolean; // Флаг для проверки основной роли
  requireFinalStage?: boolean; // Флаг для проверки наличия финальных этапов (для мастеров упаковки)
  excludeFinalStage?: boolean; // Флаг для исключения пользователей с финальными этапами (для обычных мастеров)
  ypakMashinFinalStage?: boolean; // Флаг для исключения пользователей с финальными этапами (для обычных мастеров)
  requireNoSmenTask?: boolean; // Флаг для проверки наличия noSmenTask у workplace
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredRole, 
  requiredRoles, 
  requirePrimaryRole = false,
  requireFinalStage = false,
  excludeFinalStage = false,
  ypakMashinFinalStage = false,
  requireNoSmenTask = false
}) => {
  // console.log('=== PROTECTED ROUTE - ОБНОВЛЕНО ===');
  // console.log('Props:', { requiredRole, requiredRoles, requirePrimaryRole, requireFinalStage, excludeFinalStage });
  // console.log('excludeFinalStage значение:', excludeFinalStage);
  // console.log('Тип excludeFinalStage:', typeof excludeFinalStage);

  // Проверяем аутентификацию
  if (!authService.isAuthenticated()) {
    // console.log('Пользователь не аутентифицирован, перенаправление на /login');
    return <Navigate to="/login" replace />;
  }

  const user = authService.getUser();
  
  if (!user) {
    // console.log('Нет данных пользователя, перенаправление на /login');
    return <Navigate to="/login" replace />;
  }

  // console.log('Пользователь:', user);

  // Функция для перенаправления на домашнюю страницу пользователя с учетом выбранного этапа
  const redirectToHomePage = () => {
    const homePage = authService.determineHomePageWithSelectedStage();
    // console.log('Перенаправление на домашнюю страницу:', homePage);
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

    // console.log('Проверка множественных ролей:', requiredRoles, 'Доступ:', hasAccess);

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

    // console.log('Проверка одиночной роли:', requiredRole, 'Доступ:', hasAccess);

    if (!hasAccess) {
      return redirectToHomePage();
    }
  }

  // Дополнительная проверка для финальных этапов (для мастеров упаковки)
  if (requireFinalStage) {
    // Проверяем выбранный этап, а не общее наличие финальных этапов
    const selectedStageString = localStorage.getItem('selectedStage');
    let hasAccessToFinalStage = false;
    
    if (selectedStageString) {
      try {
        const selectedStage = JSON.parse(selectedStageString);
        hasAccessToFinalStage = selectedStage.finalStage;
        // console.log('Проверка финального этапа. Выбранный этап:', selectedStage, 'Финальный:', hasAccessToFinalStage);
      } catch (error) {
        console.error('Ошибка при парсинге выбранного этапа:', error);
      }
    }
    
    if (!hasAccessToFinalStage) {
      // console.log('Нет доступа к финальному этапу, перенаправление');
      return redirectToHomePage();
    }
  }

  // Проверка на noSmenTask для workplace
  if (requireNoSmenTask) {
    const assignments = authService.getAssignments();
    if (assignments && assignments.machines && assignments.machines.length > 0) {
      const hasNoSmenTask = assignments.machines.some(machine => machine.noSmenTask === true);
      if (!hasNoSmenTask) {
        // console.log('Нет машин с noSmenTask, перенаправление');
        return redirectToHomePage();
      }
    } else {
      // console.log('Нет машин или assignments, перенаправление');
      return redirectToHomePage();
    }
  }

  // Исключение пользователей с выбранными финальными этапами (для обычных мастеров и workplace)
  if (excludeFinalStage) {
    // Дополнительная проверка для workplace - исключаем тех, у кого есть noSmenTask
    if (authService.hasRole('workplace')) {
      const assignments = authService.getAssignments();
      if (assignments && assignments.machines && assignments.machines.length > 0) {
        const hasNoSmenTask = assignments.machines.some(machine => machine.noSmenTask === true);
        if (hasNoSmenTask) {
          // console.log('У workplace есть машины с noSmenTask, перенаправление');
          return redirectToHomePage();
        }
      }
    }
    
    // Проверяем выбранный этап, а не общее наличие финальных этапов
    const selectedStageString = localStorage.getItem('selectedStage');
    if (selectedStageString) {
      try {
        const selectedStage = JSON.parse(selectedStageString);
        // console.log('Проверка исключения финального этапа. Выбранный этап:', selectedStage);
        
        // Блокируем доступ к обычной странице, если выбран финальный этап
        // Для мастеров (исключая админов) и для workplace
        if (selectedStage.finalStage && 
            ((authService.hasRole('master') && !authService.hasRole('admin')) || 
             authService.hasRole('workplace'))) {
          // console.log('Выбран финальный этап, но пытается зайти на обычную страницу, перенаправление');
          return redirectToHomePage();
        }
      } catch (error) {
        console.error('Ошибка при парсинге выбранного этапа в ProtectedRoute:', error);
      }
    }
  }

  // console.log('Все проверки пройдены, доступ разрешен');
  // Если прошли все проверки, разрешаем доступ к дочерним маршрутам
  return <Outlet />;
};

export default ProtectedRoute;
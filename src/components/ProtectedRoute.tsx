
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

interface ProtectedRouteProps {
  requiredRole?: string;
  requiredRoles?: string[];
  requirePrimaryRole?: boolean; // Флаг для проверки основной роли
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredRole, 
  requiredRoles, 
  requirePrimaryRole = false 
}) => {
  // Проверяем аутентификацию
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = authService.getUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Функция для перенаправления на домашнюю страницу пользователя
  const redirectToHomePage = () => {
    const assignments = authService.getAssignments();
    const homePage = authService.determineHomePage(user, assignments || {});
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

    if (!hasAccess) {
      return redirectToHomePage();
    }
  }

  // Если прошли все проверки, разрешаем доступ к дочерним маршрутам
  return <Outlet />;
};

export default ProtectedRoute;

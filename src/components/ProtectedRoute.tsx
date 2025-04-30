import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

interface ProtectedRouteProps {
  requiredRole?: string;
}

// Компонент для защиты маршрутов - проверяет авторизацию и роль
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();
  
  // Если пользователь не авторизован, редирект на страницу входа
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Если требуется определенная роль и роль пользователя не соответствует
  if (requiredRole && user.role.toLowerCase() !== requiredRole.toLowerCase()) {
    // Получаем ��омашнюю страницу для роли пользователя
    const assignments = authService.getAssignments() || {};
    const homePage = authService.determineHomePage(user, assignments);
    
    return <Navigate to={homePage} replace />;
  }
  
  // Если все проверки пройдены, отображаем защищенное содержимое
  return <Outlet />;
};

export default ProtectedRoute;
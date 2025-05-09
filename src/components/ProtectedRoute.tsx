import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

interface ProtectedRouteProps {
  requiredRole?: string;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, requiredRoles }) => {
  // Проверяем аутентификацию
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = authService.getUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Проверка на множественные роли
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role.toLowerCase())) {
      // Если у пользователя нет ни одной из необходимых ролей, перенаправляем
      // на соответствующую страницу в зависимости от его роли
      const assignments = authService.getAssignments();
      const homePage = authService.determineHomePage(user, assignments || {});
      return <Navigate to={homePage} replace />;
    }
  }
  // Проверка на одиночную роль
  else if (requiredRole && user.role.toLowerCase() !== requiredRole.toLowerCase()) {
    // Если у пользователя неправильная роль, перенаправляем на соответствующую страницу
    const assignments = authService.getAssignments();
    const homePage = authService.determineHomePage(user, assignments || {});
    return <Navigate to={homePage} replace />;
  }

  // Если прошли все проверки, разрешаем доступ к дочерним маршрутам
  return <Outlet />;
};

export default ProtectedRoute;
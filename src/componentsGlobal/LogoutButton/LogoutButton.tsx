import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './LogoutButton.module.css';
import LogoutIcon from '@mui/icons-material/Logout';
interface LogoutButtonProps {
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // Очищаем данные авторизации
    authService.logout();
    
    // Перенаправляем на страницу входа
    navigate('/login');
  };
  
  return (
    <button 
      onClick={handleLogout} 
      className={`${styles.logoutButton} ${className || ''}`}
      title="Выйти из системы"
    >
      {/* <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
      </svg> */}
      <LogoutIcon />
    </button>
  );
};

export default LogoutButton;

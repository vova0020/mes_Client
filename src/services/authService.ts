import axios from 'axios';

// Типы данных для авторизации
export interface AuthCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
  fullName: string;
}

export interface Machine {
  id: number;
  name: string;
  status: string;
  segmentId: number;
  segmentName: string;
}

export interface Segment {
  id: number;
  name: string;
  lineId: number;
  lineName: string;
}

export interface Assignments {
  machines?: Machine[];
  segments?: Segment[];
}

export interface AuthResponse {
  token: string;
  user: User;
  assignments: Assignments;
}

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Сервис авторизации
const authService = {
  // Функция для авторизации пользователя
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Ошибка авторизации');
      }
      throw new Error('Ошибка сети или сервера');
    }
  },

  // Сохранение данных авторизации в localStorage
  saveAuthData(authData: AuthResponse): void {
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    localStorage.setItem('assignments', JSON.stringify(authData.assignments));
    
    // Декодируем JWT для получения срока действия
    const tokenParts = authData.token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      localStorage.setItem('tokenExpires', String(payload.exp * 1000));
    }
  },

  // Получение данных пользователя из localStorage
  getUser(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  // Получение привязок пользователя из localStorage
  getAssignments(): Assignments | null {
    const assignmentsJson = localStorage.getItem('assignments');
    return assignmentsJson ? JSON.parse(assignmentsJson) : null;
  },

  // Проверка, авторизован ли пользователь
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    const tokenExpires = localStorage.getItem('tokenExpires');
    
    if (!token || !tokenExpires) {
      return false;
    }
    
    // Проверяем, не истек ли срок действия токена
    return Number(tokenExpires) > Date.now();
  },

  // Выход из системы (удаление данных авторизации)
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('assignments');
    localStorage.removeItem('tokenExpires');
  },

  // Определение начальной страницы в зависимости от роли и привязок
  determineHomePage(user: User, assignments: Assignments): string {
    const role = user.role.toLowerCase();
    
    switch (role) {
      case 'admin':
        return '/master';
        
      case 'master':
        return '/master';
        
      case 'operator':
        if (assignments.machines && assignments.machines.length > 0) {
          // Если есть только один станок, направляем сразу на него
          if (assignments.machines.length === 1) {
            return `/machine`;
          } else {
            // Если станков несколько, все равно на страницу оператора
            // В будущем можно добавить страницу выбора станка
            return '/machine';
          }
        } else {
          return '/machine';
        }
        
      default:
        // По умолчанию направляем на страницу авторизации
        return '/login';
    }
  }
};

export default authService;
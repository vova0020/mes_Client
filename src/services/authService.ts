
import axios from 'axios';

// Типы данных для авторизации
export interface AuthCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  login: string;
  roles: string[];
  primaryRole: string;
  fullName: string;
  firstName: string;
  lastName: string;
  position: string;
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
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        localStorage.setItem('tokenExpires', String(payload.exp * 1000));
      } catch (error) {
        console.error('Ошибка декодирования JWT токена:', error);
      }
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

  // Получение токена из localStorage
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  // Выход из системы (удаление данных авторизации)
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('assignments');
    localStorage.removeItem('tokenExpires');
  },

  // Проверка наличия определенной роли у пользователя
  hasRole(roleName: string): boolean {
    const user = this.getUser();
    if (!user || !user.roles) {
      return false;
    }
    return user.roles.includes(roleName);
  },

  // Проверка является ли роль основной
  isPrimaryRole(roleName: string): boolean {
    const user = this.getUser();
    if (!user) {
      return false;
    }
    return user.primaryRole === roleName;
  },

  // Определение начальной страницы в зависимости от основной роли и привязок
  determineHomePage(user: User, assignments: Assignments): string {
    const primaryRole = user.primaryRole.toLowerCase();

    switch (primaryRole) {
      case 'admin':
        return '/settings';
        
      case 'master':
        return '/master';

      case 'management':
        return '/settings';

      case 'technologist':
        return '/settings';

      case 'orderPicker':
        return '/ypakmachine';

      case 'workplace':
        return '/machine';

      case 'operator':
        if (assignments.machines && assignments.machines.length > 0) {
          // Если есть только один станок, направляем сразу на него
          if (assignments.machines.length === 1) {
            return `/machine`;
          } else {
            // Если станков несколько, направляем на страницу выбора
            return '/machine';
          }
        } else {
          return '/machine';
        }

      default:
        // Если основная роль не определена, проверяем доступные роли
        if (user.roles && user.roles.length > 0) {
          // Приоритет ролей для определения страницы по умолчанию
          const rolePriority = ['admin', 'master', 'management', 'technologist', 'orderPicker', 'workplace', 'operator'];

          for (const role of rolePriority) {
            if (user.roles.includes(role)) {
              return this.determineHomePage({ ...user, primaryRole: role }, assignments);
            }
          }
        }

        // По умолчанию направляем на страницу авторизации
        return '/login';
    }
  },

  // Получение полного имени пользователя
  getUserFullName(): string {
    const user = this.getUser();
    if (!user) {
      return '';
    }

    // Используем fullName если доступно, иначе составляем из firstName и lastName
    if (user.fullName) {
      return user.fullName;
    }

    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim();
  },

  // Получение должности пользователя
  getUserPosition(): string {
    const user = this.getUser();
    return user?.position || '';
  },

  // Получение списка ролей пользователя
  getUserRoles(): string[] {
    const user = this.getUser();
    return user?.roles || [];
  }
};

export default authService;

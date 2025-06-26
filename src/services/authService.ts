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

// Этап производства из assignments
export interface Stage {
  id: number;
  name: string;
  finalStage: boolean; // true для финальных этапов (например, упаковка)
}

export interface Assignments {
  machines?: Machine[];
  segments?: Segment[];
  stages?: Stage[];
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

    // Устанавливаем первый доступный этап как выбранный для роли master
    if (authData.user.primaryRole === 'master' && authData.assignments.stages && authData.assignments.stages.length > 0) {
      const firstStage = authData.assignments.stages[0];
      localStorage.setItem('selectedStage', JSON.stringify(firstStage));
      console.log('Установлен первый этап при авторизации:', firstStage);
    }

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
    localStorage.removeItem('selectedStage');
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

  // Определение начальной страницы в зави��имости от основной роли и привязок
  determineHomePage(user: User, assignments: Assignments): string {
    const primaryRole = user.primaryRole.toLowerCase();

    switch (primaryRole) {
      case 'admin':
        return '/settings';
        
      case 'master':
        // Для мастеров всегда направляем на обычную страницу по умолчанию
        // Конкретная страница будет определена на основе выбранного этапа
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
              // Специальная обработка для роли мастер
              if (role === 'master') {
                return '/master';
              }
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
  },

  // Проверка наличия финальных этапов у пользователя
  hasFinalStages(): boolean {
    const assignments = this.getAssignments();
    if (!assignments || !assignments.stages) {
      return false;
    }
    return assignments.stages.some(stage => stage.finalStage === true);
  },

  // Получение финальных этапов пользователя
  getFinalStages(): Stage[] {
    const assignments = this.getAssignments();
    if (!assignments || !assignments.stages) {
      return [];
    }
    return assignments.stages.filter(stage => stage.finalStage === true);
  },

  // Определение домашней страницы с учетом выбранного этапа
  determineHomePageWithSelectedStage(): string {
    const user = this.getUser();
    const assignments = this.getAssignments();
    
    console.log('=== ОПРЕДЕЛЕНИЕ ДОМАШНЕЙ СТРАНИЦЫ ===');
    console.log('Пользователь:', user);
    console.log('Assignments:', assignments);
    
    if (!user || !assignments) {
      console.log('Нет данных пользователя или assignments, перенаправление на /login');
      return '/login';
    }

    // Для мастеров проверяем выбранный этап
    if (user.primaryRole.toLowerCase() === 'master') {
      const selectedStageString = localStorage.getItem('selectedStage');
      console.log('Выбранный этап (строка):', selectedStageString);
      
      if (selectedStageString) {
        try {
          const selectedStage = JSON.parse(selectedStageString);
          console.log('Выбранный этап (объект):', selectedStage);
          const targetPage = selectedStage.finalStage ? '/ypak' : '/master';
          console.log('Целевая страница:', targetPage);
          return targetPage;
        } catch (error) {
          console.error('Ошибка при парсинге выбранного этапа:', error);
          // При ошибке парсинга используем /master по умолчанию
          return '/master';
        }
      } else {
        console.log('Нет выбранного этапа, используем /master по умолчанию');
        return '/master';
      }
    }

    // Для остальных ролей используем стандартную логику
    const homePage = this.determineHomePage(user, assignments);
    console.log('Домашняя страница для роли', user.primaryRole, ':', homePage);
    return homePage;
  }
};

export default authService;
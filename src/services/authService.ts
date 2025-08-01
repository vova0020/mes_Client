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
  status?: string;
  segmentId?: number;
  segmentName?: string;
  stages?: Stage[];
  noSmenTask?: boolean;
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
    // console.log('=== СОХРАНЕНИЕ ДАННЫХ АВТОРИЗАЦИИ ===');
    // console.log('Полные данные авторизации:', authData);
    // console.log('Роль пользователя:', authData.user.primaryRole);
    // console.log('Assignments:', authData.assignments);
    
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    localStorage.setItem('assignments', JSON.stringify(authData.assignments));

    // Устанавливаем первый доступный этап как выбранный для роли master
    if (authData.user.primaryRole === 'master' && authData.assignments.stages && authData.assignments.stages.length > 0) {
      const firstStage = authData.assignments.stages[0];
      localStorage.setItem('selectedStage', JSON.stringify(firstStage));
      // console.log('Установлен первый этап при авторизации:', firstStage);
    }

    // Устанавливаем первый доступный этап как выбранный для роли workplace (если есть этапы в машинах)
    if (authData.user.primaryRole === 'workplace') {
      // console.log('=== ОБРАБОТКА РОЛИ WORKPLACE ===');
      // console.log('Machines в assignments:', authData.assignments.machines);
      
      if (authData.assignments.machines && authData.assignments.machines.length > 0) {
        // console.log('Количество машин:', authData.assignments.machines.length);
        
        // Логируем каждую машину
        authData.assignments.machines.forEach((machine, index) => {
          // console.log(`Машина ${index + 1}:`, machine);
          // console.log(`  - ID: ${machine.id}`);
          // console.log(`  - Название: ${machine.name}`);
          // console.log(`  - Этапы:`, machine.stages);
        });
        
        // Ищем первую машину с этапами
        const machineWithStages = authData.assignments.machines.find(machine => 
          machine.stages && machine.stages.length > 0
        );
        
        // console.log('Машина с этапами:', machineWithStages);
        
        if (machineWithStages && machineWithStages.stages) {
          const firstStage = machineWithStages.stages[0];
          localStorage.setItem('selectedStage', JSON.stringify(firstStage));
          // console.log('Установлен первый этап для рабочего места при авторизации:', firstStage);
        } else {
          // console.log('Не найдено машин с этапами для workplace');
        }
      } else {
        // console.log('У пользователя workplace нет машин в assignments');
      }
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

  // Определение начальной страницы в зависимости от основной роли и привязок
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
        return '/order-management';

      case 'technologist':
        return '/order-management';

      case 'orderPicker':
        return '/ypakmachine';

      case 'workplace':
        // console.log('=== ОПРЕДЕЛЕНИЕ СТРАНИЦЫ ДЛЯ WORKPLACE ===');
        // console.log('Assignments для workplace:', assignments);
        // console.log('Machines:', assignments.machines);
        
        // Для рабочих мест сначала проверяем наличие машин с noSmenTask
        if (assignments.machines && assignments.machines.length > 0) {
          // console.log('Найдены машины, проверяем noSmenTask...');
          
          const hasNoSmenTask = assignments.machines.some(machine => machine.noSmenTask === true);
          
          if (hasNoSmenTask) {
            // console.log('Найдены машины с noSmenTask, перенаправляем на /nosmenmachine');
            return '/nosmenmachine';
          }
          
          // Если нет noSmenTask, проверяем финальные этапы
          // console.log('Нет машин с noSmenTask, проверяем финальные этапы...');
          
          // Подробно логируем каждую машину и её этапы
          assignments.machines.forEach((machine, index) => {
            // console.log(`Машина ${index + 1} (ID: ${machine.id}, Название: ${machine.name}):`);
            if (machine.stages && machine.stages.length > 0) {
              machine.stages.forEach((stage, stageIndex) => {
                // console.log(`  Этап ${stageIndex + 1}: ${stage.name} (finalStage: ${stage.finalStage})`);
              });
            } else {
              // console.log('  Нет этапов');
            }
          });
          
          const hasFinalStages = assignments.machines.some(machine => 
            machine.stages && machine.stages.some(stage => stage.finalStage === true)
          );
          
          // console.log('Есть финальные этапы:', hasFinalStages);
          
          if (hasFinalStages) {
            // console.log('Перенаправляем на /ypakmachine (финальные этапы найдены)');
            return '/ypakmachine';
          } else {
            // console.log('Перенаправляем на /machine (финальных этапов нет)');
          }
        } else {
          // console.log('У workplace нет машин, перенаправляем на /machine');
        }
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

  // Определение домашней страницы с учетом вы��ранного этапа
  determineHomePageWithSelectedStage(): string {
    const user = this.getUser();
    const assignments = this.getAssignments();
    
    // console.log('=== ОПРЕДЕЛЕНИЕ ДОМАШНЕЙ СТРАНИЦЫ ===');
    // console.log('Пользователь:', user);
    // console.log('Assignments:', assignments);
    
    if (!user || !assignments) {
      // console.log('Нет данных пользователя или assignments, перенаправление на /login');
      return '/login';
    }

    // Для мастеров проверяем выбранный этап
    if (user.primaryRole.toLowerCase() === 'master') {
      const selectedStageString = localStorage.getItem('selectedStage');
      // console.log('Выбранный этап (строка):', selectedStageString);
      
      if (selectedStageString) {
        try {
          const selectedStage = JSON.parse(selectedStageString);
          // console.log('Выбранный этап (объект):', selectedStage);
          const targetPage = selectedStage.finalStage ? '/ypak' : '/master';
          // console.log('Целевая страница:', targetPage);
          return targetPage;
        } catch (error) {
          console.error('Ошибка при парсинге выбранного этапа:', error);
          // При ошибке парсинга используем /master по умолчанию
          return '/master';
        }
      } else {
        // console.log('Нет выбранного этапа, используем /master по умолчанию');
        return '/master';
      }
    }

    // Для рабочих мест (workplace) проверяем выбранный этап
    if (user.primaryRole.toLowerCase() === 'workplace') {
      // console.log('=== ОБРАБОТКА WORKPLACE В DETERMINEHOMEPAGE ===');
      // console.log('Assignments для workplace:', assignments);
      // console.log('Machines:', assignments.machines);
      
      // Сначала проверяем наличие машин с noSmenTask
      if (assignments.machines && assignments.machines.length > 0) {
        const hasNoSmenTask = assignments.machines.some(machine => machine.noSmenTask === true);
        
        if (hasNoSmenTask) {
          // console.log('Найдены машины с noSmenTask, перенаправление на /nosmenmachine');
          return '/nosmenmachine';
        }
      }
      
      // Проверяем выбранный этап из localStorage
      const selectedStageString = localStorage.getItem('selectedStage');
      // console.log('Выбранный этап (строка):', selectedStageString);
      
      if (selectedStageString) {
        try {
          const selectedStage = JSON.parse(selectedStageString);
          // console.log('Выбранный этап (объект):', selectedStage);
          
          if (selectedStage.finalStage) {
            // console.log('Workplace с финальным этапом, перенаправление на /ypakmachine');
            return '/ypakmachine';
          } else {
            // console.log('Workplace с обычным этапом, перенаправление на /machine');
            return '/machine';
          }
        } catch (error) {
          console.error('Ошибка при парсинге выбранного этапа:', error);
        }
      }
      
      // Если нет выбранного этапа, проверяем наличие финальных этапов в машинах
      let hasFinalStages = false;
      
      if (assignments.machines && assignments.machines.length > 0) {
        // console.log('Проверяем финальные этапы в машинах...');
        
        // Подробно логируем каждую маши��у
        assignments.machines.forEach((machine, index) => {
          // console.log(`Машина ${index + 1}:`, machine);
          if (machine.stages) {
            // console.log(`  Этапы машины ${machine.name}:`, machine.stages);
            machine.stages.forEach(stage => {
              // console.log(`    - ${stage.name} (finalStage: ${stage.finalStage})`);
            });
          }
        });
        
        hasFinalStages = assignments.machines.some(machine => 
          machine.stages && machine.stages.some(stage => stage.finalStage === true)
        );
        
        // console.log('Результат проверки финальных этапов:', hasFinalStages);
      } else {
        // console.log('Нет машин у workplace пользователя');
      }
      
      if (hasFinalStages) {
        // console.log('Рабочее место с финальными этапами, перенаправление на /ypakmachine');
        return '/ypakmachine';
      } else {
        // console.log('Рабочее место без финальных этапов, перенаправление на /machine');
        return '/machine';
      }
    }

    // Для остальных ролей используем стандартную логику
    const homePage = this.determineHomePage(user, assignments);
    // console.log('Домашняя страница для роли', user.primaryRole, ':', homePage);
    return homePage;
  }
};

export default authService;
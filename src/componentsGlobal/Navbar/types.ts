// Импорт типа Stage для использования в этом файле
import type { Stage } from '../../modules/api/navbarApi';
// Экспорт типов для использования в других частях приложения
export type { Stage, NavbarApiResponse } from '../../modules/api/navbarApi';

// Дополнительные типы для компонента
export interface StageNavbarProps {
  currentStageName?: string;
}

export interface UserData {
  id: number;
  login: string;
  roles: string[];
  primaryRole: string;
  firstName: string;
  fullName: string;
  lastName: string;
}

export interface AssignmentsData {
  stages: Stage[];
}


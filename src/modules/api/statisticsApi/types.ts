export enum UnitOfMeasurement {
  PIECES = 'PIECES',
  SQUARE_METERS = 'SQUARE_METERS'
}

export enum DateRangeType {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM'
}

export enum MachineStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  BROKEN = 'BROKEN'
}

export interface ProductionLine {
  lineId: number;
  lineName: string;
  lineType: string;
}

export interface DataPoint {
  date: string;
  value: number;
}

export interface StageStats {
  stageId: number;
  stageName: string;
  totalValue: number;
  unit: UnitOfMeasurement;
  dataPoints: DataPoint[];
}

export interface MachineStats {
  machineId: number;
  machineName: string;
  totalValue: number;
  unit: string;
  dataPoints: DataPoint[];
}

export interface LineStatsParams {
  lineId: number;
  dateRangeType: DateRangeType;
  date?: string;
  startDate?: string;
  endDate?: string;
  unit?: UnitOfMeasurement;
}

export interface StageStatsParams extends LineStatsParams {
  stageId: number;
}

export interface StageInfo {
  stageId: number;
  stageName: string;
}

export interface StatusBreakdown {
  status: MachineStatus;
  hours: number;
  percentage: number;
}

export interface MachineUptimeStats {
  machineId: number;
  machineName: string;
  currentStatus: MachineStatus;
  statusBreakdown: StatusBreakdown[];
}

export interface MachineUptimeResponse {
  startDate: string;
  endDate: string;
  machines: MachineUptimeStats[];
}

export interface GetMachineUptimeParams {
  dateRangeType: DateRangeType;
  stageId?: number;
  startDate?: string;
  endDate?: string;
}

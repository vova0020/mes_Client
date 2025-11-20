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
  unit: UnitOfMeasurement;
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

export type ProductionLineType = 'PRIMARY' | 'SECONDARY';

export interface IProductionLine {
  id: number;
  name: string;
  type: ProductionLineType;
}

export interface IProductionSegment {
  id: number;
  name: string;
  lineId: number;
}
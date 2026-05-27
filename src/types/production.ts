export enum ProductionType {
  SERIAL = 'SERIAL',
  CUSTOM = 'CUSTOM',
  BOTH = 'BOTH'
}

export const PRODUCTION_TYPE_LABELS: Record<ProductionType, string> = {
  [ProductionType.SERIAL]: 'Серийное',
  [ProductionType.CUSTOM]: 'Индивидуальное',
  [ProductionType.BOTH]: 'Оба типа'
};

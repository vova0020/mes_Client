// === ENUM ===

export enum CellStatus {
  AVAILABLE = 'AVAILABLE',  // Доступна
  OCCUPIED = 'OCCUPIED',    // Занята
  RESERVED = 'RESERVED'     // Зарезервирована
}

// === ИНТЕРФЕЙСЫ ОТВЕТОВ ===

export interface BufferResponse {
  bufferId: number;
  bufferName: string;
  description: string | null;
  location: string;
  cellsCount: number;
  stagesCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BufferDetailResponse extends BufferResponse {
  bufferCells: BufferCellResponse[];
  bufferStages: BufferStageResponse[];
}

export interface BufferCellResponse {
  cellId: number;
  bufferId: number;
  cellCode: string;
  status: CellStatus;
  capacity: number;
  currentLoad: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BufferStageResponse {
  bufferStageId: number;
  bufferId: number;
  stageId: number;
  stage: {
    stageId: number;
    stageName: string;
    description: string | null;
  };
}

// === DTO ДЛЯ ЗАПРОСОВ ===

export interface CreateBufferDto {
  bufferName: string;           // Обязательно, макс 100 символов
  description?: string;         // Опционально, макс 500 символов
  location: string;            // Обязательно, макс 200 символов
  cells?: CreateBufferCellDto[]; // Опционально
  stageIds?: number[];         // Опционально
}

export interface UpdateBufferDto {
  bufferName?: string;         // Опционально, макс 100 символов
  description?: string;        // Опционально, макс 500 символов
  location?: string;          // Опционально, макс 200 символов
}

export interface CreateBufferCellDto {
  cellCode: string;            // Обязательно, макс 20 символов
  status?: CellStatus;         // Опционально, по умолчанию AVAILABLE
  capacity: number;            // Обязательно, >= 0
  currentLoad?: number;        // Опционально, >= 0, по умолчанию 0
}

export interface UpdateBufferCellDto {
  cellCode?: string;           // Опционально, макс 20 символов
  status?: CellStatus;         // Опционально
  capacity?: number;           // Опционально, >= 0
  currentLoad?: number;        // Опционально, >= 0
}

export interface CopyBufferDto {
  newBufferName: string;       // Обязательно
  newLocation?: string;        // Опционально
  copyCells?: boolean;         // Опционально, по умолчанию true
  copyStages?: boolean;        // Опционально, по умолчанию true
}

export interface CreateBufferStageDto {
  stageId: number;             // Обязательно
}

export interface UpdateBufferStagesDto {
  stageIds: number[];          // Обязательно
}

// === ИНТЕРФЕЙСЫ СТАТИСТИКИ ===

export interface BuffersStatistics {
  buffers: number;
  bufferCells: number;
  bufferStageConnections: number;
  occupiedCells: number;
  reservedCells: number;
  availableCells: number;
  pickerTasks: number;
}

export interface BufferCellsStatistics {
  bufferId: number;
  bufferName: string;
  totalCells: number;
  availableCells: number;
  occupiedCells: number;
  reservedCells: number;
  totalCapacity: number;
  totalCurrentLoad: number;
  utilizationPercentage: number;
}

// === ДОПОЛНИТЕЛЬНЫЕ ИНТЕРФЕЙСЫ ===

export interface AvailableStage {
  stageId: number;
  stageName: string;
  description: string | null;
  _count: {
    bufferStages: number;
  };
}

export interface StagesWithBuffersResponse {
  stageId: number;
  stageName: string;
  description: string | null;
  buffersCount: number;
  buffers: {
    bufferId: number;
    bufferName: string;
    location: string;
  }[];
}

// === ИНТЕРФЕЙСЫ ДЛЯ API ===

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// === ТИПЫ ДЛЯ КОМПОНЕНТОВ ===

export interface BufferFormData {
  bufferName: string;
  description: string;
  location: string;
  cells: CreateBufferCellDto[];
  stageIds: number[];
}

export interface CellFormData {
  cellCode: string;
  capacity: number;
  currentLoad: number;
  status: CellStatus;
}

// === ТИПЫ ДЛЯ WEBSOCKET СОБЫТИЙ ===

export interface BufferSocketEvent<T = any> {
  data: T;
  timestamp: string;
  bufferId?: number;
  bufferName?: string;
}

export interface BufferCreatedEvent extends BufferSocketEvent<{
  buffer: BufferDetailResponse;
}> {}

export interface BufferUpdatedEvent extends BufferSocketEvent<{
  buffer: BufferDetailResponse;
  changes: {
    name: boolean;
    location: boolean;
  };
}> {}

export interface BufferDeletedEvent extends BufferSocketEvent<{
  bufferId: number;
  bufferName: string;
}> {}

export interface BufferCopiedEvent extends BufferSocketEvent<{
  originalBuffer: BufferDetailResponse;
  copiedBuffer: BufferDetailResponse;
  copyOptions: {
    copyCells: boolean;
    copyStages: boolean;
  };
}> {}

export interface BufferCellCreatedEvent extends BufferSocketEvent<{
  bufferId: number;
  bufferName: string;
  bufferCell: BufferCellResponse;
}> {}

export interface BufferCellUpdatedEvent extends BufferSocketEvent<{
  bufferId: number;
  bufferName: string;
  bufferCell: BufferCellResponse;
  changes: {
    cellCode: boolean;
    status: boolean;
  };
}> {}

export interface BufferCellDeletedEvent extends BufferSocketEvent<{
  cellId: number;
  bufferId: number;
  bufferName: string;
  cellCode: string;
}> {}

export interface BufferStageCreatedEvent extends BufferSocketEvent<{
  bufferId: number;
  bufferName: string;
  bufferStage: BufferStageResponse;
}> {}

export interface BufferStagesUpdatedEvent extends BufferSocketEvent<{
  bufferId: number;
  bufferName: string;
  bufferStages: BufferStageResponse[];
}> {}

export interface BufferStageDeletedEvent extends BufferSocketEvent<{
  bufferStageId: number;
  bufferId: number;
  bufferName: string;
  stageId: number;
  stageName: string;
}> {}

// === UTILITY TYPES ===

export type BufferViewMode = 'list' | 'create' | 'edit' | 'detail';

export type BufferTabType = 'info' | 'cells' | 'stages';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: keyof BufferResponse;
  direction: SortDirection;
}

export interface FilterConfig {
  search?: string;
  location?: string;
  status?: CellStatus;
  minCells?: number;
  maxCells?: number;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

// === VALIDATION TYPES ===

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// === THEME TYPES ===

export interface BufferTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

// === EXPORT ALL ===



export { };
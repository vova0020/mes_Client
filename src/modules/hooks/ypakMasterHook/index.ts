// Экспорт хуков для упаковок
export * from './usePackaging';

// Экспорт хуков для деталей
export * from './useParts';

// Экспорт хуков для поддонов
export * from './usePallets';

// Экспорт старого хука для обратной совместимости (можно удалить после миграции)
export { default as usePackagingDetails } from './packagingMasterHook';
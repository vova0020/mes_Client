// Экспорт хуков для упаковок
export { default as usePackaging } from './usePackaging';

// Экспорт хуков для деталей
export { default as useParts } from './useParts';

// Экспорт хуков для поддонов
export { default as usePallets } from './usePallets';

// Экспорт хуков для заказов
export { default as useOrders } from './useOrdersMaster';

// Экспорт хуков для станков
export { default as useMachines } from './useMachinesMaster';

// Экспорт старого хука для обратной совместимости (можно удалить после миграции)
export { default as usePackagingDetails } from './packagingMasterHook';
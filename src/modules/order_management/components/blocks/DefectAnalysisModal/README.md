# DefectAnalysisModal - Модуль истории обработки

## Структура

Модуль разделен на 3 независимых компонента:

### 1. DefectAnalysisModal.tsx (Обертка)
- Главный компонент с вкладками
- Управляет переключением между двумя модулями
- Экспортируется по умолчанию

### 2. DefectAnalysis.tsx (Анализ брака)
- Модуль для работы с браком
- Фильтры: период, заказ, материал, станок, этап
- Статистика: общая, по материалам, по станкам, по этапам
- Детальная таблица с информацией о возвратах

### 3. ProductionReport.tsx (Учёт выпуска продукции)
- Модуль для учёта выпуска продукции
- Фильтры: период, рабочее место (станок)
- Статистика: операции, детали, время работы
- Журнал операций с детальной информацией

## Использование

```tsx
import DefectAnalysisModal from './DefectAnalysisModal';

// Использование главного компонента с вкладками
<DefectAnalysisModal onClose={handleClose} />

// Или использование отдельных модулей
import { DefectAnalysis, ProductionReport } from './DefectAnalysisModal';

<DefectAnalysis onClose={handleClose} />
<ProductionReport onClose={handleClose} />
```

## Стили

Каждый компонент имеет свой CSS модуль:
- `DefectAnalysisModal.module.css` - стили обертки с вкладками
- `DefectAnalysis.module.css` - стили модуля анализа брака
- `ProductionReport.module.css` - стили модуля учёта выпуска

## API

Все компоненты используют API из:
`../../../../api/orderManagementApi/defectStatisticsApi`

- `getFilterOptions()` - получение опций для фильтров
- `getDefectStatistics(params)` - получение данных о браке
- `getMachineProduction(params)` - получение данных о выпуске

import * as XLSX from 'xlsx';
import { UnreturnedDefectRecord } from '../../../../api/orderManagementApi/unreturnedDefectsApi';

/**
 * Экспорт данных о невозвращенных деталях в Excel с красивым форматированием
 */
export function exportToExcel(records: UnreturnedDefectRecord[]): void {
  // Подготовка данных для экспорта
  const exportData = records.map((record) => ({
    'Дата обнаружения': new Date(record.detectedAt).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    'Номер партии': record.orderBatchNumber,
    'Название заказа': record.orderName,
    'Код упаковки': record.packageCode,
    'Название упаковки': record.packageName,
    'Код детали': record.partCode,
    'Название детали': record.partName,
    'Размер детали': record.partSize || '—',
    'Материал': record.materialName || '—',
    'Артикул материала': record.materialSku || '—',
    'Количество невозвращенных': record.unreturnedQuantity,
  }));

  // Создание рабочей книги и листа
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  
  // Установка ширины колонок
  const columnWidths = [
    { wch: 18 }, // Дата обнаружения
    { wch: 15 }, // Номер партии
    { wch: 25 }, // Название заказа
    { wch: 15 }, // Код упаковки
    { wch: 30 }, // Название упаковки
    { wch: 15 }, // Код детали
    { wch: 30 }, // Название детали
    { wch: 15 }, // Размер детали
    { wch: 20 }, // Материал
    { wch: 20 }, // Артикул материала
    { wch: 12 }, // Количество невозвращенных
  ];
  worksheet['!cols'] = columnWidths;

  // Получение диапазона данных
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Стилизация заголовков (первая строка)
  const headerStyle = {
    fill: {
      fgColor: { rgb: 'FF4A90E2' } // Синий цвет фона
    },
    font: {
      bold: true,
      color: { rgb: 'FFFFFFFF' }, // Белый текст
      sz: 12
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
      wrapText: true
    },
    border: {
      top: { style: 'thin', color: { rgb: 'FF000000' } },
      bottom: { style: 'thin', color: { rgb: 'FF000000' } },
      left: { style: 'thin', color: { rgb: 'FF000000' } },
      right: { style: 'thin', color: { rgb: 'FF000000' } }
    }
  };

  // Стиль для данных
  const dataStyle = {
    alignment: {
      vertical: 'center',
      wrapText: false
    },
    border: {
      top: { style: 'thin', color: { rgb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { rgb: 'FFD3D3D3' } },
      left: { style: 'thin', color: { rgb: 'FFD3D3D3' } },
      right: { style: 'thin', color: { rgb: 'FFD3D3D3' } }
    }
  };

  // Стиль для четных строк (зебра)
  const evenRowStyle = {
    ...dataStyle,
    fill: {
      fgColor: { rgb: 'FFF5F5F5' } // Светло-серый фон
    }
  };

  // Стиль для колонки с количеством (выделение красным)
  const quantityStyle = {
    ...dataStyle,
    font: {
      bold: true,
      color: { rgb: 'FFE74C3C' }, // Красный цвет
      sz: 11
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    }
  };

  // Применение стилей к ячейкам
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      
      if (!worksheet[cellAddress]) continue;
      
      // Инициализация стиля ячейки
      if (!worksheet[cellAddress].s) {
        worksheet[cellAddress].s = {};
      }

      if (R === 0) {
        // Заголовок
        worksheet[cellAddress].s = headerStyle;
      } else {
        // Данные
        if (C === 10) {
          // Колонка "Количество невозвращенных"
          worksheet[cellAddress].s = {
            ...quantityStyle,
            fill: R % 2 === 0 ? evenRowStyle.fill : undefined
          };
        } else {
          // Остальные колонки
          worksheet[cellAddress].s = R % 2 === 0 ? evenRowStyle : dataStyle;
        }
      }
    }
  }

  // Добавление информационного листа с датой формирования отчета
  const now = new Date();
  const reportInfo = [
    ['Отчет: Журнал внутренних рекламаций (Невозвращенные детали)'],
    [''],
    ['Дата формирования:', now.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })],
    ['Всего записей:', records.length],
    ['Общее количество невозвращенных деталей:', records.reduce((sum, r) => sum + r.unreturnedQuantity, 0)],
  ];

  const infoSheet = XLSX.utils.aoa_to_sheet(reportInfo);
  
  // Стилизация информационного листа
  infoSheet['!cols'] = [{ wch: 50 }, { wch: 30 }];
  
  if (infoSheet['A1']) {
    infoSheet['A1'].s = {
      font: { bold: true, sz: 14, color: { rgb: 'FF2C3E50' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    };
  }

  // Добавление листов в книгу
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Информация');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Невозвращенные детали');

  // Формирование имени файла с датой
  const dateStr = now.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\./g, '-');
  const timeStr = now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).replace(/:/g, '-');
  
  const fileName = `Невозвращенные_детали_${dateStr}_${timeStr}.xlsx`;

  // Сохранение файла
  XLSX.writeFile(workbook, fileName, { 
    bookType: 'xlsx',
    cellStyles: true 
  });
}

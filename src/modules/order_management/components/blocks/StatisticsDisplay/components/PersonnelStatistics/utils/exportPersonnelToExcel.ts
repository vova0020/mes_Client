import * as XLSX from 'xlsx';
import { OperatorProductivityRecord } from '../../../../../../../api/statisticsApi';

interface ExportParams {
  records: OperatorProductivityRecord[];
  dateFrom: string;
  dateTo: string;
  totalAuthorizedSeconds: number;
  unitSums: Record<string, number>;
}

const formatSeconds = (s: number): string => {
  const total = Math.round(s / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h} ч ${String(m).padStart(2, '0')} мин`;
};

const num = (n: number): string =>
  Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 0 });

// Стиль ячейки
const makeStyle = (opts: {
  bold?: boolean;
  fontSize?: number;
  fgColor?: string;
  fontColor?: string;
  border?: boolean;
  hAlign?: string;
}) => {
  const s: any = {};

  if (opts.bold || opts.fontSize || opts.fontColor) {
    s.font = {};
    if (opts.bold) s.font.bold = true;
    if (opts.fontSize) s.font.sz = opts.fontSize;
    if (opts.fontColor) s.font.color = { rgb: opts.fontColor };
  }

  if (opts.fgColor) {
    s.fill = {
      fgColor: { rgb: opts.fgColor },
      patternType: 'solid',
    };
  }

  if (opts.border) {
    const thin = { style: 'thin', color: { rgb: 'CCCCCC' } };
    s.border = { top: thin, bottom: thin, left: thin, right: thin };
  }

  if (opts.hAlign) {
    s.alignment = { horizontal: opts.hAlign };
  }

  return s;
};

// Создать стилизованную ячейку
const cell = (
  value: string | number,
  style?: any
): any => {
  const c: any = {
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
  };
  if (style) c.s = style;
  return c;
};

// Применить стили к строке в worksheet
const setRow = (ws: any, row: number, cells: any[], startCol = 0) => {
  cells.forEach((c, i) => {
    const ref = XLSX.utils.encode_cell({ r: row, c: startCol + i });
    ws[ref] = c;
  });
};

// Получить или создать worksheet с диапазоном
const createWs = (): any => {
  return { '!ref': 'A1' };
};

const updateRange = (ws: any, maxRow: number, maxCol: number) => {
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } });
};

export const exportPersonnelToExcel = ({
  records,
  dateFrom,
  dateTo,
  totalAuthorizedSeconds,
  unitSums,
}: ExportParams): void => {
  const workbook = XLSX.utils.book_new();

  // ===== Стили =====
  const titleStyle = makeStyle({ bold: true, fontSize: 16, fontColor: '1F4E79', fgColor: 'D6E4F0' });
  const subtitleStyle = makeStyle({ bold: true, fontSize: 12, fontColor: '2E75B6' });
  const headerStyle = makeStyle({ bold: true, fontSize: 11, fgColor: '2E75B6', fontColor: 'FFFFFF', border: true });
  const kpiLabelStyle = makeStyle({ bold: true, fontSize: 11, fgColor: 'E2EFDA', fontColor: '375623', border: true });
  const kpiValueStyle = makeStyle({ bold: true, fontSize: 13, fgColor: 'E2EFDA', fontColor: '1F4E79', border: true, hAlign: 'right' });
  const operatorStyle = makeStyle({ bold: true, fontSize: 11, fgColor: 'D9E2F3', fontColor: '1F3864', border: true });
  const dataStyle = makeStyle({ border: true, fontSize: 10 });
  const dataNumStyle = makeStyle({ border: true, fontSize: 10, hAlign: 'right' });
  const unitHeaderStyle = makeStyle({ bold: true, fontSize: 11, fgColor: 'FFF2CC', fontColor: '7F6000', border: true });
  const unitValueStyle = makeStyle({ bold: true, fontSize: 12, fgColor: 'FFF2CC', fontColor: '375623', border: true, hAlign: 'right' });
  const footerStyle = makeStyle({ fontSize: 9, fontColor: '808080' });

  // ========== Лист 1: Сводка ==========
  const ws1 = createWs();
  let r = 0;

  // Заголовок
  setRow(ws1, r, [cell('ВЫРАБОТКА ПЕРСОНАЛА — СВОДНЫЙ ОТЧЁТ', titleStyle)]);
  ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  r += 2;

  // Период
  setRow(ws1, r, [
    cell('Период:', subtitleStyle),
    cell(`${dateFrom || '—'} — ${dateTo || '—'}`, makeStyle({ fontSize: 11 })),
  ]);
  r++;
  setRow(ws1, r, [
    cell('Дата формирования:', subtitleStyle),
    cell(new Date().toLocaleString('ru-RU'), makeStyle({ fontSize: 11 })),
  ]);
  r += 2;

  // KPI блок
  setRow(ws1, r, [cell('КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ', subtitleStyle)]);
  r++;

  setRow(ws1, r, [
    cell('Показатель', kpiLabelStyle),
    cell('Значение', kpiLabelStyle),
  ]);
  r++;
  setRow(ws1, r, [
    cell('Сотрудников в отчёте', kpiLabelStyle),
    cell(records.length, kpiValueStyle),
  ]);
  r++;
  setRow(ws1, r, [
    cell('Общее время авторизации', kpiLabelStyle),
    cell(formatSeconds(totalAuthorizedSeconds), kpiValueStyle),
  ]);
  r += 2;

  // Выпуск по единицам
  setRow(ws1, r, [cell('ФАКТИЧЕСКИЙ ВЫПУСК', subtitleStyle)]);
  r++;
  setRow(ws1, r, [
    cell('Единица измерения', unitHeaderStyle),
    cell('Количество', unitHeaderStyle),
  ]);
  r++;
  Object.entries(unitSums).forEach(([unit, qty]) => {
    setRow(ws1, r, [
      cell(unit, unitHeaderStyle),
      cell(qty, unitValueStyle),
    ]);
    r++;
  });

  r++;
  setRow(ws1, r, [cell('Данные сформированы автоматически из системы MES', footerStyle)]);

  updateRange(ws1, r, 3);
  ws1['!cols'] = [{ wch: 32 }, { wch: 28 }, { wch: 20 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(workbook, ws1, 'Сводка');

  // ========== Лист 2: Детализация ==========
  const ws2 = createWs();
  const merges2: any[] = [];
  r = 0;

  // Заголовок
  setRow(ws2, r, [cell('ДЕТАЛИЗАЦИЯ ВЫРАБОТКИ ПО ОПЕРАТОРАМ', titleStyle)]);
  merges2.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });
  r++;
  setRow(ws2, r, [cell(`Период: ${dateFrom || '—'} — ${dateTo || '—'}`, subtitleStyle)]);
  merges2.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 7 } });
  r += 2;

  // Заголовки таблицы
  const headers = ['Оператор', 'Станок', 'Код станка', 'Выпуск', 'Ед. изм.', 'Время привязки', 'Привязок', '№ операторов'];
  setRow(ws2, r, headers.map((h) => cell(h, headerStyle)));
  r++;

  // Данные
  records.forEach((rec) => {
    // Строка оператора (группа)
    setRow(ws2, r, [
      cell(rec.operatorName, operatorStyle),
      cell('', operatorStyle),
      cell('', operatorStyle),
      cell(num(rec.totalQuantity), { ...operatorStyle, alignment: { horizontal: 'right' } }),
      cell('', operatorStyle),
      cell(formatSeconds(rec.totalAuthorizedSeconds), { ...operatorStyle, alignment: { horizontal: 'right' } }),
      cell(rec.bindingCount, { ...operatorStyle, alignment: { horizontal: 'right' } }),
      cell('', operatorStyle),
    ]);
    r++;

    // Детализация по станкам
    rec.machines.forEach((m) => {
      setRow(ws2, r, [
        cell('', dataStyle),
        cell(m.machineName || '—', dataStyle),
        cell(m.machineCode || '—', dataStyle),
        cell(m.quantityProcessed, dataNumStyle),
        cell(m.loadUnit || '—', dataStyle),
        cell(formatSeconds(m.authorizedSeconds), dataNumStyle),
        cell(m.bindingCount, dataNumStyle),
        cell(m.operatorNumbers?.join(', ') || '—', dataStyle),
      ]);
      r++;
    });
  });

  r++;
  setRow(ws2, r, [cell('Время — по суммарной авторизации. Выпуск — в единицах измерения станка.', footerStyle)]);

  ws2['!merges'] = merges2;
  updateRange(ws2, r, 7);
  ws2['!cols'] = [
    { wch: 26 },
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 12 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(workbook, ws2, 'Детализация');

  // ========== Лист 3: По этапам (если есть) ==========
  const hasStages = records.some((rec) => rec.stages && rec.stages.length > 0);
  if (hasStages) {
    const ws3 = createWs();
    const merges3: any[] = [];
    r = 0;

    setRow(ws3, r, [cell('ВЫРАБОТКА ПО ЭТАПАМ ПРОИЗВОДСТВА', titleStyle)]);
    merges3.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });
    r++;
    setRow(ws3, r, [cell(`Период: ${dateFrom || '—'} — ${dateTo || '—'}`, subtitleStyle)]);
    merges3.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 2 } });
    r += 2;

    setRow(ws3, r, [
      cell('Оператор', headerStyle),
      cell('Этап', headerStyle),
      cell('Выпуск', headerStyle),
    ]);
    r++;

    records.forEach((rec) => {
      if (rec.stages && rec.stages.length > 0) {
        rec.stages.forEach((stage, idx) => {
          setRow(ws3, r, [
            cell(idx === 0 ? rec.operatorName : '', idx === 0 ? operatorStyle : dataStyle),
            cell(stage.stageName, dataStyle),
            cell(stage.quantityProcessed, dataNumStyle),
          ]);
          r++;
        });
      }
    });

    ws3['!merges'] = merges3;
    updateRange(ws3, r, 2);
    ws3['!cols'] = [{ wch: 28 }, { wch: 25 }, { wch: 14 }];

    XLSX.utils.book_append_sheet(workbook, ws3, 'По этапам');
  }

  // Сохранение
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Выработка_персонала_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

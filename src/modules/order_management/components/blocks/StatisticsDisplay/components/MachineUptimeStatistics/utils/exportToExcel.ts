import * as XLSX from 'xlsx';
import { MachineStatus } from '../../../../../../../api/statisticsApi';

const statusLabels: Record<MachineStatus, string> = {
  [MachineStatus.ACTIVE]: 'Активен',
  [MachineStatus.INACTIVE]: 'Не активен',
  [MachineStatus.MAINTENANCE]: 'Обслуживание',
  [MachineStatus.BROKEN]: 'Поломка'
};

export const exportMachineUptimeToExcel = (data: any) => {
  const workbook = XLSX.utils.book_new();
  
  const summaryData: any[] = [
    ['Статистика работы станков'],
    ['Период:', `${new Date(data.startDate).toLocaleString('ru-RU')} — ${new Date(data.endDate).toLocaleString('ru-RU')}`],
    [],
    ['Станок', 'Текущий статус', 'Активен (ч)', 'Не активен (ч)', 'Обслуживание (ч)', 'Поломка (ч)', 'Время работы (%)']
  ];

  data.machines.forEach((machine: any) => {
    const statusData = machine.statusBreakdown.reduce((acc: any, sb: any) => {
      acc[sb.status] = sb.hours;
      return acc;
    }, {});

    summaryData.push([
      machine.machineName,
      statusLabels[machine.currentStatus],
      statusData[MachineStatus.ACTIVE]?.toFixed(2) || '0',
      statusData[MachineStatus.INACTIVE]?.toFixed(2) || '0',
      statusData[MachineStatus.MAINTENANCE]?.toFixed(2) || '0',
      statusData[MachineStatus.BROKEN]?.toFixed(2) || '0',
      machine.statusBreakdown.find((sb: any) => sb.status === MachineStatus.ACTIVE)?.percentage?.toFixed(1) + '%' || '0%'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  
  ws['!cols'] = [
    { wch: 25 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'Сводка');

  const fileName = `Статистика_станков_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

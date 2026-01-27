import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styles from './MachineUptimeStatistics.module.css';

type DateRange = '24h' | 'week' | 'month' | 'custom';

interface MachineStatus {
  name: string;
  value: number;
  color: string;
}

interface MachineData {
  id: string;
  name: string;
  statuses: MachineStatus[];
}

const MachineUptimeStatistics: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('24h');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Дефолтные данные для станков
  const machinesData: MachineData[] = [
    {
      id: '1',
      name: 'Распиловочный станок CNC-1',
      statuses: [
        { name: 'Активен', value: 16, color: '#4CAF50' },
        { name: 'Не активен', value: 5, color: '#9E9E9E' },
        { name: 'Обслуживание', value: 2, color: '#FF9800' },
        { name: 'Поломка', value: 1, color: '#F44336' }
      ]
    },
    {
      id: '2',
      name: 'Кромкооблицовочный станок KDT-1',
      statuses: [
        { name: 'Активен', value: 18, color: '#4CAF50' },
        { name: 'Не активен', value: 4, color: '#9E9E9E' },
        { name: 'Обслуживание', value: 1.5, color: '#FF9800' },
        { name: 'Поломка', value: 0.5, color: '#F44336' }
      ]
    },
    {
      id: '3',
      name: 'Сверлильно-присадочный станок SVP-1',
      statuses: [
        { name: 'Активен', value: 15, color: '#4CAF50' },
        { name: 'Не активен', value: 6, color: '#9E9E9E' },
        { name: 'Обслуживание', value: 2, color: '#FF9800' },
        { name: 'Поломка', value: 1, color: '#F44336' }
      ]
    },
    {
      id: '4',
      name: 'Сборочный стол SB-1',
      statuses: [
        { name: 'Активен', value: 17, color: '#4CAF50' },
        { name: 'Не активен', value: 5, color: '#9E9E9E' },
        { name: 'Обслуживание', value: 1, color: '#FF9800' },
        { name: 'Поломка', value: 1, color: '#F44336' }
      ]
    }
  ];

  const renderCustomLabel = (entry: any) => {
    return `${entry.value}ч`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.dateRangeButtons}>
          <button
            className={`${styles.rangeButton} ${dateRange === '24h' ? styles.active : ''}`}
            onClick={() => setDateRange('24h')}
          >
            24 часа
          </button>
          <button
            className={`${styles.rangeButton} ${dateRange === 'week' ? styles.active : ''}`}
            onClick={() => setDateRange('week')}
          >
            Неделя
          </button>
          <button
            className={`${styles.rangeButton} ${dateRange === 'month' ? styles.active : ''}`}
            onClick={() => setDateRange('month')}
          >
            Месяц
          </button>
          <button
            className={`${styles.rangeButton} ${dateRange === 'custom' ? styles.active : ''}`}
            onClick={() => setDateRange('custom')}
          >
            Свои даты
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className={styles.customDateRange}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
            <span>—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        )}
      </div>

      <div className={styles.chartsGrid}>
        {machinesData.map((machine) => (
          <div key={machine.id} className={styles.chartCard}>
            <h3 className={styles.machineName}>{machine.name}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={machine.statuses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {machine.statuses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} часов`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MachineUptimeStatistics;

import React, { useState } from 'react';
import styles from './TimeStatistics.module.css';

interface TimeData {
  workstations: Array<{
    name: string;
    dateRange: string;
    planned: number;
    actual: number;
    efficiency: number;
  }>;
}

interface TimeStatisticsProps {
  data: TimeData;
}

const TimeStatistics: React.FC<TimeStatisticsProps> = ({ data }) => {
  const [selectedWorkstation, setSelectedWorkstation] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const [filteredData, setFilteredData] = useState(data.workstations);

  const handleWorkstationChange = (workstation: string) => {
    setSelectedWorkstation(workstation);
    if (workstation === 'all') {
      setFilteredData(data.workstations);
    } else {
      const filtered = data.workstations.filter(ws => ws.name.toLowerCase().includes(workstation.replace('ws', 'станок')));
      setFilteredData(filtered.length > 0 ? filtered : [data.workstations[parseInt(workstation.replace('ws', '')) - 1] || data.workstations[0]]);
    }
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const multiplier = range === 'today' ? 0.4 : range === 'week' ? 0.8 : range === 'month' ? 1 : 1.3;
    const newData = data.workstations.map(station => {
      const newEfficiency = Math.min(95, Math.max(60, Math.round(station.efficiency * multiplier * (0.9 + Math.random() * 0.2))));
      const newActual = Math.round(station.actual * multiplier * (0.85 + Math.random() * 0.3));
      return {
        ...station,
        actual: newActual,
        efficiency: newEfficiency,
        dateRange: range === 'today' ? 'Сегодня' : range === 'week' ? 'Неделя' : range === 'month' ? 'Месяц' : 'Квартал'
      };
    });
    setFilteredData(newData);
  };

  const handleExportToExcel = () => {
    alert('Экспорт данных в Excel - функция в разработке');
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentGrid}>
        <div className={styles.chartSection}>
          <div className={styles.controlsRow}>
            <div className={styles.controlGroup}>
              <label>Выбор рабочих мест</label>
              <select 
                className={styles.select}
                value={selectedWorkstation}
                onChange={(e) => handleWorkstationChange(e.target.value)}
              >
                <option value="all">Все рабочие места</option>
                <option value="ws1">Распиловочный станок CNC-1</option>
                <option value="ws2">Кромкооблицовочный станок KDT-1</option>
                <option value="ws3">Сверлильно-присадочный станок SVP-1</option>
                <option value="ws4">Сборочный стол SB-1</option>
              </select>
            </div>
            
            <div className={styles.controlGroup}>
              <label>Выбор диапазона дат</label>
              <select 
                className={styles.select}
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
              >
                <option value="today">Сегодня</option>
                <option value="week">Последняя неделя</option>
                <option value="month">Последний месяц</option>
                <option value="quarter">Последний квартал</option>
              </select>
            </div>
          </div>
          
          <div className={styles.pieChartsGrid}>
            {filteredData.map((station, index) => (
              <div key={`${selectedWorkstation}-${dateRange}-${index}`} className={styles.pieChartContainer}>
                <div className={styles.pieChartTitle}>{station.name}</div>
                <div className={styles.pieChart}>
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" strokeWidth="20"/>
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="50" 
                      fill="none" 
                      stroke="#4caf50" 
                      strokeWidth="20"
                      strokeDasharray={`${station.efficiency * 3.14} 314`}
                      strokeDashoffset="78.5"
                      transform="rotate(-90 60 60)"
                      className={styles.animatedCircle}
                      style={{ animationDelay: `${index * 0.2}s` }}
                    />
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="50" 
                      fill="none" 
                      stroke="#f44336" 
                      strokeWidth="20"
                      strokeDasharray={`${(100 - station.efficiency) * 3.14} 314`}
                      strokeDashoffset={`${-station.efficiency * 3.14 + 78.5}`}
                      transform="rotate(-90 60 60)"
                      className={styles.animatedCircle}
                      style={{ animationDelay: `${index * 0.2 + 0.1}s` }}
                    />
                  </svg>
                  <div className={styles.pieChartCenter}>
                    <div className={styles.pieChartValue}>{station.actual}</div>
                    <div className={styles.pieChartLabel}>Фактическая выработка</div>
                    <div className={styles.pieChartPlanned}>{station.planned}</div>
                  </div>
                </div>
                <div className={styles.pieChartFooter}>{station.dateRange}</div>
                <div className={styles.efficiencyBadge}>
                  Эффективность: {station.efficiency}%
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.sidePanel}>
          <button className={styles.exportButton} onClick={handleExportToExcel}>
            Выгрузить данные в Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeStatistics;
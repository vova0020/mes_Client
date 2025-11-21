import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useProductionLines, useLineStats, useStageStats } from '../../../../../../hooks/statisticsHook';
import { DateRangeType, UnitOfMeasurement } from '../../../../../../api/statisticsApi'
import styles from './ProductionStatistics.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface ProductionData {
  streams: Array<{
    name: string;
    planned: number;
    actual: number;
  }>;
}

interface ProductionStatisticsProps {
  data: ProductionData;
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

const periodToDateRangeType = (period: PeriodType): DateRangeType => {
  switch (period) {
    case 'day': return DateRangeType.DAY;
    case 'week': return DateRangeType.WEEK;
    case 'month': return DateRangeType.MONTH;
    case 'year': return DateRangeType.YEAR;
    case 'custom': return DateRangeType.CUSTOM;
  }
};



const ProductionStatistics: React.FC<ProductionStatisticsProps> = ({ data }) => {
  const { lines, loading: linesLoading } = useProductionLines();
  
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [unit, setUnit] = useState<UnitOfMeasurement>(UnitOfMeasurement.SQUARE_METERS);
  const [period, setPeriod] = useState<PeriodType>('day');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showTotal, setShowTotal] = useState(false);

  const currentDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const { stats: stageStats, loading: stageLoading } = useLineStats(
    selectedLineId,
    periodToDateRangeType(period),
    currentDate,
    dateFrom,
    dateTo,
    unit
  );
  
  const { stats: machineStats, loading: machineLoading } = useStageStats(
    selectedLineId,
    selectedStageId,
    periodToDateRangeType(period),
    currentDate,
    dateFrom,
    dateTo
  );
  
  const chartDataByUnit = useMemo(() => {
    const stats = selectedStageId ? machineStats : stageStats;
    
    if (!stats || stats.length === 0) {
      return [];
    }
    
    if (selectedStageId) {
      const groupedByUnit = new Map<string, any[]>();
      stats.forEach((s: any) => {
        const unitKey = s.unit || 'unknown';
        if (!groupedByUnit.has(unitKey)) {
          groupedByUnit.set(unitKey, []);
        }
        groupedByUnit.get(unitKey)!.push(s);
      });
      
      return Array.from(groupedByUnit.entries()).map(([unitKey, machines]) => {
        const allDates = new Set<string>();
        machines.forEach((m: any) => {
          (m.dataPoints || []).forEach((dp: any) => allDates.add(dp.date));
        });
        const sortedDates = Array.from(allDates).sort();
        
        return {
          unit: unitKey,
          labels: sortedDates,
          datasets: machines.map((m: any) => ({
            label: m.machineName,
            data: sortedDates.map(date => {
              const point = (m.dataPoints || []).find((dp: any) => dp.date === date);
              return point ? point.value : 0;
            })
          }))
        };
      });
    }
    
    if (showTotal) {
      if (selectedStageId) {
        const groupedByUnit = new Map<string, any[]>();
        stats.forEach((s: any) => {
          const unitKey = s.unit || 'unknown';
          if (!groupedByUnit.has(unitKey)) {
            groupedByUnit.set(unitKey, []);
          }
          groupedByUnit.get(unitKey)!.push(s);
        });
        
        return Array.from(groupedByUnit.entries()).map(([unitKey, machines]) => ({
          unit: unitKey,
          labels: machines.map((m: any) => m.machineName),
          datasets: [{
            label: '',
            data: machines.map((m: any) => m.totalValue)
          }]
        }));
      }
      
      return [{
        unit: unit === UnitOfMeasurement.SQUARE_METERS ? 'м²' : 'шт',
        labels: stats.map((s: any) => s.stageName),
        datasets: [{
          label: '',
          data: stats.map((s: any) => s.totalValue)
        }]
      }];
    }
    
    const allDates = new Set<string>();
    stats.forEach((s: any) => {
      (s.dataPoints || []).forEach((dp: any) => allDates.add(dp.date));
    });
    const sortedDates = Array.from(allDates).sort();
    
    return [{
      unit: unit === UnitOfMeasurement.SQUARE_METERS ? 'м²' : 'шт',
      labels: sortedDates,
      datasets: stats.map((s: any) => ({
        label: s.stageName,
        data: sortedDates.map(date => {
          const point = (s.dataPoints || []).find((dp: any) => dp.date === date);
          return point ? point.value : 0;
        })
      }))
    }];
  }, [stageStats, machineStats, selectedStageId, showTotal, unit]);

  const selectedLine = lines.find((l: any) => l.lineId === selectedLineId);
  const selectedStage = stageStats.find((s: any) => s.stageId === selectedStageId);
  
  const colors = [
    { bg: 'rgba(78, 205, 196, 0.6)', border: 'rgb(78, 205, 196)' },
    { bg: 'rgba(255, 107, 107, 0.6)', border: 'rgb(255, 107, 107)' },
    { bg: 'rgba(52, 152, 219, 0.6)', border: 'rgb(52, 152, 219)' },
    { bg: 'rgba(155, 89, 182, 0.6)', border: 'rgb(155, 89, 182)' },
    { bg: 'rgba(241, 196, 15, 0.6)', border: 'rgb(241, 196, 15)' },
    { bg: 'rgba(230, 126, 34, 0.6)', border: 'rgb(230, 126, 34)' },
    { bg: 'rgba(46, 204, 113, 0.6)', border: 'rgb(46, 204, 113)' },
    { bg: 'rgba(231, 76, 60, 0.6)', border: 'rgb(231, 76, 60)' },
    { bg: 'rgba(149, 165, 166, 0.6)', border: 'rgb(149, 165, 166)' },
    { bg: 'rgba(26, 188, 156, 0.6)', border: 'rgb(26, 188, 156)' },
    { bg: 'rgba(255, 159, 64, 0.6)', border: 'rgb(255, 159, 64)' },
    { bg: 'rgba(153, 102, 255, 0.6)', border: 'rgb(153, 102, 255)' },
    { bg: 'rgba(255, 205, 86, 0.6)', border: 'rgb(255, 205, 86)' },
    { bg: 'rgba(75, 192, 192, 0.6)', border: 'rgb(75, 192, 192)' },
    { bg: 'rgba(54, 162, 235, 0.6)', border: 'rgb(54, 162, 235)' }
  ];
  

  
  if (linesLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }
  
  if (!selectedLineId && lines.length > 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>📊 Выберите производственный поток</h2>
          <p className={styles.emptyText}>Для просмотра статистики выберите один из доступных потоков:</p>
          <div className={styles.lineSelector}>
            {lines.map((line: any) => (
              <button
                key={line.lineId}
                className={styles.lineBtn}
                onClick={() => setSelectedLineId(line.lineId)}
              >
                <span className={styles.lineName}>{line.lineName}</span>
                <span className={styles.lineType}>{line.lineType}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#333',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff'
      }
    },
    scales: {
      x: {
        ticks: { color: '#666' },
        grid: { color: 'rgba(0, 0, 0, 0.1)' }
      },
      y: {
        ticks: { color: '#666' },
        grid: { color: 'rgba(0, 0, 0, 0.1)' }
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📊 Статистика производства</h2>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>Поток:</label>
          <select 
            className={styles.select}
            value={selectedLineId || ''}
            onChange={(e) => {
              setSelectedLineId(Number(e.target.value));
              setSelectedStageId(null);
            }}
          >
            {lines.map((line: any) => (
              <option key={line.lineId} value={line.lineId}>{line.lineName}</option>
            ))}
          </select>
        </div>

        <div className={styles.periodButtons}>
          <button 
            className={`${styles.periodBtn} ${period === 'day' ? styles.active : ''}`}
            onClick={() => {
              setPeriod('day');
              setDateFrom('');
              setDateTo('');
            }}
          >
            День
          </button>
          <button 
            className={`${styles.periodBtn} ${period === 'week' ? styles.active : ''}`}
            onClick={() => {
              setPeriod('week');
              setDateFrom('');
              setDateTo('');
            }}
          >
            Неделя
          </button>
          <button 
            className={`${styles.periodBtn} ${period === 'month' ? styles.active : ''}`}
            onClick={() => {
              setPeriod('month');
              setDateFrom('');
              setDateTo('');
            }}
          >
            Месяц
          </button>
          <button 
            className={`${styles.periodBtn} ${period === 'year' ? styles.active : ''}`}
            onClick={() => {
              setPeriod('year');
              setDateFrom('');
              setDateTo('');
            }}
          >
            Год
          </button> 
        </div>

        <div className={styles.dateRange}>
          <input 
            type="date" 
            className={styles.dateInput}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="От"
          />
          <span className={styles.dateSeparator}>—</span>
          <input 
            type="date" 
            className={styles.dateInput}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="До"
          />
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>
            {showTotal ? 'Суммарная выработка' : selectedStageId ? `Станки - ${selectedStage?.stageName}` : `Этапы - ${selectedLine?.lineName}`}
          </h3>
          
          <div className={styles.chartControls}>
            {!selectedStageId && (
              <div className={styles.unitToggle}>
                <button
                  className={`${styles.unitBtn} ${unit === UnitOfMeasurement.SQUARE_METERS ? styles.active : ''}`}
                  onClick={() => setUnit(UnitOfMeasurement.SQUARE_METERS)}
                >
                  м²
                </button>
                <button
                  className={`${styles.unitBtn} ${unit === UnitOfMeasurement.PIECES ? styles.active : ''}`}
                  onClick={() => setUnit(UnitOfMeasurement.PIECES)}
                >
                  шт
                </button>
              </div>
            )}

            <label className={styles.checkbox}>
              <input 
                type="checkbox"
                checked={showTotal}
                onChange={(e) => setShowTotal(e.target.checked)}
              />
              <span>Суммарная выработка</span>
            </label>
          </div>
        </div>

        {(stageLoading || machineLoading) ? (
          <div className={styles.chartContainer}>
            <div className={styles.chartLoading}>
              <div className={styles.loadingSpinner}></div>
            </div>
          </div>
        ) : (
          chartDataByUnit.map((chartData, chartIdx) => {
            const colorOffset = chartIdx * 3;
            const barChartData = {
              labels: chartData.labels,
              datasets: (chartData.datasets || []).map((dataset, idx) => {
                const color = colors[(idx + colorOffset) % colors.length];
                return {
                  label: `${dataset.label} (${chartData.unit})`,
                  data: dataset.data,
                  backgroundColor: showTotal ? chartData.labels.map((_, labelIdx) => colors[(labelIdx + colorOffset) % colors.length].bg) : color.bg,
                  borderColor: showTotal ? chartData.labels.map((_, labelIdx) => colors[(labelIdx + colorOffset) % colors.length].border) : color.border,
                  borderWidth: 2,
                  borderRadius: 4
                };
              })
            };
            
            return (
              <div key={chartIdx} className={styles.chartContainer} style={{ marginBottom: chartIdx < chartDataByUnit.length - 1 ? '24px' : '0' }}>
                <Bar data={barChartData} options={chartOptions} />
              </div>
            );
          })
        )}

        {!selectedStageId && stageStats.length > 0 && (
          <div className={styles.stageSelector}>
            <h4 className={styles.stageSelectorTitle}>Выберите этап для просмотра станков:</h4>
            <div className={styles.stageButtons}>
              {stageStats.map((stage: any) => (
                <button
                  key={stage.stageId}
                  className={`${styles.stageBtn} ${selectedStageId === stage.stageId ? styles.active : ''}`}
                  onClick={() => setSelectedStageId(stage.stageId)}
                >
                  {stage.stageName}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedStageId && (
          <button 
            className={styles.backBtn}
            onClick={() => setSelectedStageId(null)}
          >
            ← Вернуться к этапам
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductionStatistics;
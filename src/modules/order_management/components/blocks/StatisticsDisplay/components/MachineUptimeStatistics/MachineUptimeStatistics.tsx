import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useMachineUptimeStages, useMachineUptimeStats } from '../../../../../../hooks/statisticsHook';
import { DateRangeType, MachineStatus } from '../../../../../../api/statisticsApi';
import { useWebSocketRoom } from '../../../../../../../hooks/useWebSocketRoom';
import styles from './MachineUptimeStatistics.module.css';

type DateRange = '24h' | 'week' | 'month' | 'custom';

const dateRangeToType = (range: DateRange): DateRangeType => {
  switch (range) {
    case '24h': return DateRangeType.DAY;
    case 'week': return DateRangeType.WEEK;
    case 'month': return DateRangeType.MONTH;
    case 'custom': return DateRangeType.CUSTOM;
  }
};

const statusColors: Record<MachineStatus, string> = {
  [MachineStatus.ACTIVE]: '#4CAF50',
  [MachineStatus.INACTIVE]: '#9E9E9E',
  [MachineStatus.MAINTENANCE]: '#FF9800',
  [MachineStatus.BROKEN]: '#F44336'
};

const statusLabels: Record<MachineStatus, string> = {
  [MachineStatus.ACTIVE]: 'Активен',
  [MachineStatus.INACTIVE]: 'Не активен',
  [MachineStatus.MAINTENANCE]: 'Обслуживание',
  [MachineStatus.BROKEN]: 'Поломка'
};

const MachineUptimeStatistics: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('24h');
  const [stageFilter, setStageFilter] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const { stages, loading: stagesLoading } = useMachineUptimeStages();
  const { data, loading: statsLoading } = useMachineUptimeStats(
    dateRangeToType(dateRange),
    stageFilter,
    startDate,
    endDate,
    refreshKey
  );

  const { socket } = useWebSocketRoom({ room: 'room:statisticks' });

  useEffect(() => {
    if (!socket) return;

    const handleStatisticsUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    socket.on('statisticks:event', handleStatisticsUpdate);

    return () => {
      socket.off('statisticks:event', handleStatisticsUpdate);
    };
  }, [socket]);

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h} ч`;
    return `${h} ч ${m} м`;
  };

  const renderCustomLabel = (entry: any) => {
    return `${formatTime(entry.value)} (${entry.payload.percentage.toFixed(0)}%)`;
  };

  if (stagesLoading) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>Этап:</label>
          <select 
            className={styles.select}
            value={stageFilter || ''}
            onChange={(e) => setStageFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Все станки</option>
            {stages.map(stage => (
              <option key={stage.stageId} value={stage.stageId}>{stage.stageName}</option>
            ))}
          </select>
        </div>

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
            <span className={styles.dateSeparator}>—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        )}
      </div>

      {statsLoading ? (
        <div>Загрузка данных...</div>
      ) : data ? (
        <>
          <div className={styles.dateRange}>
            Период: {formatDate(data.startDate)} — {formatDate(data.endDate)}
          </div>
          <div className={styles.chartsGrid}>
            {data.machines.map((machine) => (
            <div key={machine.machineId} className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.machineName}>{machine.machineName}</h3>
                <div className={`${styles.statusBadge} ${styles[machine.currentStatus.toLowerCase()]}`}>
                  {statusLabels[machine.currentStatus]}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={machine.statusBreakdown
                      .filter(sb => sb.hours > 0)
                      .map(sb => ({
                        name: statusLabels[sb.status],
                        value: sb.hours,
                        percentage: sb.percentage
                      }))}
                    cx="50%"
                    cy="50%"
                    labelLine={{
                      stroke: 'rgba(255, 255, 255, 0.5)',
                      strokeWidth: 1
                    }}
                    label={renderCustomLabel}
                    outerRadius={70}
                    innerRadius={45}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={3}
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    style={{ fontSize: '10px', fontWeight: 600 }}
                  >
                    {machine.statusBreakdown.filter(sb => sb.hours > 0).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={statusColors[entry.status]}
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatTime(value)}
                    contentStyle={{
                      background: '#2d3441',
                      border: '1px solid #3498db',
                      borderRadius: '4px',
                      padding: '8px',
                      color: 'white',
                      fontWeight: 600
                    }}
                    itemStyle={{
                      color: 'white'
                    }}
                    labelStyle={{
                      color: 'white'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px'
                    }}
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ 
                        color: '#333', 
                        fontWeight: 600,
                        fontSize: '13px'
                      }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
        </>
      ) : null}
    </div>
  );
};

export default MachineUptimeStatistics;

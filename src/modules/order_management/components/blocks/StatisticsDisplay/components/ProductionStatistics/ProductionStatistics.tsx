import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import styles from './ProductionStatistics.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
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

const ProductionStatistics: React.FC<ProductionStatisticsProps> = ({ data }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [viewType, setViewType] = useState<'streams' | 'stages' | 'workstations'>('streams');
  const [currentData, setCurrentData] = useState(data.streams);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentData(prev => prev.map(item => ({
        ...item,
        actual: Math.max(0, item.planned * (0.7 + Math.random() * 0.4))
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const multiplier = period === 'today' ? 0.4 : period === 'week' ? 0.8 : period === 'month' ? 1 : 1.3;
    setCurrentData(data.streams.map(item => ({
      ...item,
      actual: Math.round(item.actual * multiplier * (0.8 + Math.random() * 0.4))
    })));
  };

  const handleViewTypeChange = (type: 'streams' | 'stages' | 'workstations') => {
    setViewType(type);
    let newData;
    if (type === 'stages') {
      newData = [
        { name: 'Подготовка', planned: 800, actual: 750 },
        { name: 'Обработка', planned: 1200, actual: 1100 },
        { name: 'Сборка', planned: 900, actual: 850 },
        { name: 'Контроль', planned: 600, actual: 580 }
      ];
    } else if (type === 'workstations') {
      newData = [
        { name: 'Станок 1', planned: 400, actual: 380 },
        { name: 'Станок 2', planned: 450, actual: 420 },
        { name: 'Станок 3', planned: 380, actual: 360 },
        { name: 'Станок 4', planned: 420, actual: 400 },
        { name: 'Станок 5', planned: 350, actual: 340 }
      ];
    } else {
      newData = data.streams;
    }
    setCurrentData(newData);
  };

  const barChartData = {
    labels: currentData.map(item => item.name),
    datasets: [
      {
        label: 'План',
        data: currentData.map(item => item.planned),
        backgroundColor: 'rgba(78, 205, 196, 0.6)',
        borderColor: '#4ECDC4',
        borderWidth: 2,
        borderRadius: 4
      },
      {
        label: 'Факт',
        data: currentData.map(item => Math.round(item.actual)),
        backgroundColor: 'rgba(255, 107, 107, 0.6)',
        borderColor: '#FF6B6B',
        borderWidth: 2,
        borderRadius: 4
      }
    ]
  };

  const efficiencyData = {
    labels: currentData.map(item => item.name),
    datasets: [{
      data: currentData.map(item => Math.round((item.actual / item.planned) * 100)),
      backgroundColor: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
      ],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const trendData = {
    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    datasets: [
      {
        label: 'Выработка',
        data: [85, 92, 78, 95, 88, 90],
        borderColor: '#4ECDC4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#4ECDC4',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
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
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          padding: 15,
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: (context: any) => `${context.label}: ${context.parsed}%`
        }
      }
    }
  };

  const totalPlanned = currentData.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = currentData.reduce((sum, item) => sum + item.actual, 0);
  const efficiency = Math.round((totalActual / totalPlanned) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📊 Статистика производства</h2>
        <div className={styles.periodSelector}>
          <button 
            className={`${styles.periodBtn} ${selectedPeriod === 'today' ? styles.active : ''}`}
            onClick={() => handlePeriodChange('today')}
          >
            Сегодня
          </button>
          <button 
            className={`${styles.periodBtn} ${selectedPeriod === 'week' ? styles.active : ''}`}
            onClick={() => handlePeriodChange('week')}
          >
            Неделя
          </button>
          <button 
            className={`${styles.periodBtn} ${selectedPeriod === 'month' ? styles.active : ''}`}
            onClick={() => handlePeriodChange('month')}
          >
            Месяц
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{Math.round(totalActual)}</div>
          <div className={styles.statLabel}>Общая выработка (м²)</div>
          <div className={styles.statTrend}>↑ +12%</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{efficiency}%</div>
          <div className={styles.statLabel}>Эффективность</div>
          <div className={styles.statTrend}>↑ +5%</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{currentData.length}</div>
          <div className={styles.statLabel}>Активных потоков</div>
          <div className={styles.statTrend}>→ 0%</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>₽2.1М</div>
          <div className={styles.statLabel}>Выручка</div>
          <div className={styles.statTrend}>↑ +18%</div>
        </div>
      </div>

      <div className={styles.viewTypeButtons}>
        <button 
          className={`${styles.viewBtn} ${viewType === 'streams' ? styles.active : ''}`}
          onClick={() => handleViewTypeChange('streams')}
        >
          Потоки
        </button>
        <button 
          className={`${styles.viewBtn} ${viewType === 'stages' ? styles.active : ''}`}
          onClick={() => handleViewTypeChange('stages')}
        >
          Этапы
        </button>
        <button 
          className={`${styles.viewBtn} ${viewType === 'workstations' ? styles.active : ''}`}
          onClick={() => handleViewTypeChange('workstations')}
        >
          Станки
        </button>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>План vs Факт</h3>
          <div className={styles.chartContainer}>
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Эффективность (%)</h3>
          <div className={styles.chartContainer}>
            <Doughnut data={efficiencyData} options={doughnutOptions} />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Тренд выработки</h3>
          <div className={styles.chartContainer}>
            <Line data={trendData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionStatistics;
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
import styles from './BreakdownStatistics.module.css';

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

const BreakdownStatistics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [breakdownStats, setBreakdownStats] = useState({
    total: 23,
    downtime: 71,
    cost: 185,
    availability: 94
  });
  const [breakdownTypes, setBreakdownTypes] = useState([35, 25, 20, 12, 8]);
  const [downtimeByMachine, setDowntimeByMachine] = useState([12, 8, 15, 6, 20, 10]);
  const [trendDataPoints, setTrendDataPoints] = useState([8, 12, 6, 15, 9, 7]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreakdownStats(prev => ({
        total: Math.max(15, prev.total + Math.floor(Math.random() * 3) - 1),
        downtime: Math.max(50, prev.downtime + Math.floor(Math.random() * 6) - 2),
        cost: Math.max(150, prev.cost + Math.floor(Math.random() * 20) - 10),
        availability: Math.min(98, Math.max(90, prev.availability + Math.floor(Math.random() * 3) - 1))
      }));
      
      setBreakdownTypes(prev => prev.map(val => Math.max(5, val + Math.floor(Math.random() * 6) - 3)));
      setDowntimeByMachine(prev => prev.map(val => Math.max(3, val + Math.floor(Math.random() * 4) - 2)));
      setTrendDataPoints(prev => [...prev.slice(1), Math.max(3, prev[prev.length - 1] + Math.floor(Math.random() * 6) - 3)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const multiplier = period === 'week' ? 0.7 : period === 'month' ? 1 : 1.4;
    
    setBreakdownStats({
      total: Math.round(23 * multiplier),
      downtime: Math.round(71 * multiplier),
      cost: Math.round(185 * multiplier),
      availability: Math.min(98, Math.max(85, Math.round(94 * (0.9 + Math.random() * 0.2))))
    });
  };

  // Данные для графика поломок по типам
  const breakdownTypesData = {
    labels: ['Механические', 'Электрические', 'Гидравлические', 'Программные', 'Износ'],
    datasets: [
      {
        data: breakdownTypes,
        backgroundColor: [
          'linear-gradient(135deg, #FF6B6B, #FF8E8E)',
          'linear-gradient(135deg, #4ECDC4, #6EDDD6)',
          'linear-gradient(135deg, #45B7D1, #67C3DD)',
          'linear-gradient(135deg, #96CEB4, #B2D8C4)',
          'linear-gradient(135deg, #FFEAA7, #FFF0C4)'
        ],
        borderColor: [
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FFEAA7'
        ],
        borderWidth: 3,
        hoverOffset: 15,
        hoverBorderWidth: 4,
        hoverBackgroundColor: [
          '#FF5252',
          '#26C6DA',
          '#29B6F6',
          '#81C784',
          '#FFD54F'
        ],

      }
    ]
  };

  // Данные для графика времени простоя
  const downtimeData = {
    labels: ['Станок 1', 'Станок 2', 'Станок 3', 'Станок 4', 'Станок 5', 'Станок 6'],
    datasets: [
      {
        label: 'Время простоя (часы)',
        data: downtimeByMachine,
        backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
        borderColor: ['#FF5252', '#26C6DA', '#29B6F6', '#81C784', '#FFD54F', '#BA68C8'],
        borderWidth: 3,
        borderRadius: {
          topLeft: 12,
          topRight: 12,
          bottomLeft: 4,
          bottomRight: 4
        },
        borderSkipped: false,
        hoverBackgroundColor: ['#FF5252', '#26C6DA', '#29B6F6', '#81C784', '#FFD54F', '#BA68C8'],
        hoverBorderColor: '#fff',
        hoverBorderWidth: 4,

      }
    ]
  };

  // Данные для тренда поломок
  const trendChartData = {
    labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
    datasets: [
      {
        label: 'Количество поломок',
        data: trendDataPoints,
        borderColor: '#FF6B6B',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(255, 107, 107, 0.4)');
          gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.2)');
          gradient.addColorStop(1, 'rgba(255, 107, 107, 0.05)');
          return gradient;
        },
        tension: 0.4,
        fill: true,
        pointBackgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
        pointBorderColor: '#fff',
        pointBorderWidth: 4,
        pointRadius: 10,
        pointHoverRadius: 14,
        pointHoverBackgroundColor: '#FF4444',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 5,
        borderWidth: 4,

      },
      {
        label: 'Прогноз',
        data: [null, null, null, null, trendDataPoints[4], trendDataPoints[5] + 2],
        borderColor: '#4ECDC4',
        backgroundColor: 'transparent',
        borderDash: [10, 5],
        tension: 0.4,
        fill: false,
        pointBackgroundColor: '#4ECDC4',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 12,
        borderWidth: 3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutCubic' as const,
      delay: (context: any) => context.dataIndex * 100
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: { size: 14, weight: 'bold' as const },
          padding: 25,
          usePointStyle: true,
          pointStyle: 'rectRounded' as const,
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(78, 205, 196, 0.5)',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: true,
        titleFont: { size: 16, weight: 'bold' as const },
        bodyFont: { size: 14 },
        padding: 16,
        caretSize: 8,
        multiKeyBackground: 'rgba(78, 205, 196, 0.8)',
        titleMarginBottom: 12,
        bodySpacing: 8
      }
    },
    scales: {
      x: {
        ticks: { 
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 13, weight: 'bold' as const },
          padding: 10
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.08)',
          drawBorder: false,
          lineWidth: 1
        },
        border: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: { 
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 13, weight: 'bold' as const },
          padding: 15,
          callback: function(value: any) {
            return value + 'ч';
          }
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.08)',
          drawBorder: false,
          lineWidth: 1
        },
        border: {
          display: false
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000,
      easing: 'easeInOutCubic' as const,
      delay: (context: any) => context.dataIndex * 200
    },
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
          padding: 25,
          font: { size: 14, weight: 'bold' as const },
          usePointStyle: true,
          pointStyle: 'rectRounded' as const,
          boxWidth: 15,
          boxHeight: 15,
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor[i],
                  lineWidth: 2,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(78, 205, 196, 0.5)',
        borderWidth: 2,
        cornerRadius: 12,
        titleFont: { size: 16, weight: 'bold' as const },
        bodyFont: { size: 14 },
        padding: 16,
        displayColors: true,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return [`${label}: ${value} случаев`, `Доля: ${percentage}%`];
          }
        }
      }
    },
    cutout: '65%',
    radius: '90%',
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        hoverBorderWidth: 5,
        hoverBorderColor: '#fff'
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📊 Анализ поломок станков</h2>
        <div className={styles.periodSelector}>
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
          <button 
            className={`${styles.periodBtn} ${selectedPeriod === 'year' ? styles.active : ''}`}
            onClick={() => handlePeriodChange('year')}
          >
            Год
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{breakdownStats.total}</div>
          <div className={styles.statLabel}>Всего поломок</div>
          <div className={styles.statTrend}>↓ -15%</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{breakdownStats.downtime}ч</div>
          <div className={styles.statLabel}>Время простоя</div>
          <div className={styles.statTrend}>↑ +8%</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>₽{breakdownStats.cost}к</div>
          <div className={styles.statLabel}>Стоимость ремонта</div>
          <div className={styles.statTrend}>↓ -22%</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{breakdownStats.availability}%</div>
          <div className={styles.statLabel}>Готовность оборудования</div>
          <div className={styles.statTrend}>↑ +3%</div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Типы поломок</h3>
          <div className={styles.chartContainer}>
            <Doughnut data={breakdownTypesData} options={doughnutOptions} />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Время простоя по станкам</h3>
          <div className={styles.chartContainer}>
            <Bar data={downtimeData} options={chartOptions} />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Тренд поломок</h3>
          <div className={styles.chartContainer}>
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>

        <div className={styles.alertsCard}>
          <h3 className={styles.chartTitle}>🚨 Критические уведомления</h3>
          <div className={styles.alertsList}>
            <div className={styles.alert}>
              <div className={styles.alertIcon}>⚠️</div>
              <div className={styles.alertContent}>
                <div className={styles.alertTitle}>Станок 5 - Превышение времени простоя</div>
                <div className={styles.alertTime}>2 часа назад</div>
              </div>
            </div>
            <div className={styles.alert}>
              <div className={styles.alertIcon}>🔧</div>
              <div className={styles.alertContent}>
                <div className={styles.alertTitle}>Плановое ТО - Станок 2</div>
                <div className={styles.alertTime}>Завтра в 14:00</div>
              </div>
            </div>
            <div className={styles.alert}>
              <div className={styles.alertIcon}>📊</div>
              <div className={styles.alertContent}>
                <div className={styles.alertTitle}>Увеличение частоты поломок</div>
                <div className={styles.alertTime}>На этой неделе</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakdownStatistics;
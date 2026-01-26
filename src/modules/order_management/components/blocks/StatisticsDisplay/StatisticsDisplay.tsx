import React, { useState } from 'react';
import styles from './StatisticsDisplay.module.css';
import ProductionStatistics from './components/ProductionStatistics/ProductionStatistics';
import TimeStatistics from './components/TimeStatistics/TimeStatistics';
import BreakdownStatistics from './components/BreakdownStatistics/BreakdownStatistics';

interface StatisticsDisplayProps {
  onBack?: () => void;
}

const StatisticsDisplay: React.FC<StatisticsDisplayProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'production' | 'time' | 'breakdowns'>('production');

  // Тестовые данные для мебельной фабрики
  const productionData = {
    streams: [
      { name: 'Распил', planned: 1200, actual: 1150 },
      { name: 'Кромкование', planned: 1100, actual: 1050 },
      { name: 'Сверление', planned: 900, actual: 880 },
      { name: 'Сборка', planned: 800, actual: 820 },
      { name: 'Упаковка', planned: 950, actual: 900 },
      { name: 'Отделка', planned: 750, actual: 720 }
    ]
  };

  const timeData = {
    workstations: [
      { name: 'Распиловочный станок CNC-1', dateRange: '01.11-15.11', planned: 34000, actual: 27000, efficiency: 79 },
      { name: 'Кромкооблицовочный станок KDT-1', dateRange: '01.11-15.11', planned: 32000, actual: 28500, efficiency: 89 },
      { name: 'Сверлильно-присадочный станок SVP-1', dateRange: '01.11-15.11', planned: 28000, actual: 24000, efficiency: 86 },
      { name: 'Сборочный стол SB-1', dateRange: '01.11-15.11', planned: 25000, actual: 22000, efficiency: 88 }
    ]
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'production':
        return <ProductionStatistics data={productionData} onBack={onBack} />;
      case 'time':
        return <TimeStatistics data={timeData} />;
      case 'breakdowns':
        return <BreakdownStatistics />;
      default:
        return <ProductionStatistics data={productionData} onBack={onBack} />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Статистика производства</h2>
      </div>
      
      <div className={styles.tabNavigation}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'production' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('production')}
        >
          Статистика по выработке
        </button>
        {/* <button 
          className={`${styles.tabButton} ${activeTab === 'time' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('time')}
        >
          Статистика по времени
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'breakdowns' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('breakdowns')}
        >
          Статистика по поломкам
        </button> */}
      </div>
      
      <div className={styles.tabContentContainer}>
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default StatisticsDisplay;
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import styles from './SeriesSection.module.css';

interface Series {
  id: string;
  name: string;
  isExpanded: boolean;
}

interface SeriesSectionProps {
  series: Series[];
  onAddSeries: (name: string) => void;
  onToggleSeries: (seriesId: string) => void;
  selectedSeriesId: string | null;
}

export const SeriesSection: React.FC<SeriesSectionProps> = ({
  series,
  onAddSeries,
  onToggleSeries,
  selectedSeriesId
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState('');

  const handleAddSeries = () => {
    if (newSeriesName.trim()) {
      onAddSeries(newSeriesName.trim());
      setNewSeriesName('');
      setIsAddingNew(false);
    }
  };

  const handleCancel = () => {
    setNewSeriesName('');
    setIsAddingNew(false);
  };

  return (
    <div className={styles['series-section']}>
      <div className={styles['section-header']}>
        <h3>Серии</h3>
        <button
          className={`${styles.btn} ${styles['btn--primary']} ${styles['btn--small']}`}
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew}
        >
          <PlusIcon className={styles.icon} />
          Добавить серию
        </button>
      </div>

      <div className={styles['section-content']}>
        {/* Форма добавления новой серии */}
        {isAddingNew && (
          <div className={styles['add-form']}>
            <input
              type="text"
              placeholder="Название серии"
              value={newSeriesName}
              onChange={(e) => setNewSeriesName(e.target.value)}
              className={styles['form-input']}
              autoFocus
            />
            <div className={styles['add-form__actions']}>
              <button
                className={`${styles.btn} ${styles['btn--primary']} ${styles['btn--small']}`}
                onClick={handleAddSeries}
              >
                Сохранить
              </button>
              <button
                className={`${styles.btn} ${styles['btn--secondary']} ${styles['btn--small']}`}
                onClick={handleCancel}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Список серий */}
        <div className={styles['series-list']}>
          {series.map((serie) => (
            <div
              key={serie.id}
              className={`${styles['series-item']} ${
                selectedSeriesId === serie.id ? styles['series-item--selected'] : ''
              }`}
            >
              <button
                className={styles['series-item__toggle']}
                onClick={() => onToggleSeries(serie.id)}
              >
                {serie.isExpanded ? (
                  <ChevronDownIcon className={styles.icon} />
                ) : (
                  <ChevronRightIcon className={styles.icon} />
                )}
                <span className={styles['series-item__name']}>{serie.name}</span>
              </button>
            </div>
          ))}
        </div>

        {series.length === 0 && !isAddingNew && (
          <div className={styles['empty-state']}>
            <p>Нет созданных серий</p>
            <p className={styles['empty-state__hint']}>Добавьте первую серию для начала работы</p>
          </div>
        )}
      </div>
    </div>
  );
};
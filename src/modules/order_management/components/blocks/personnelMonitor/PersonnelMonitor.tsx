import React, { useMemo, useState } from 'react';
import { useOperatorWorkMonitor } from '../../../../hooks/operatorHook/useOperatorWorkMonitor';
import { WorkMonitorOperatorDto } from '../../../../api/operatorApi/operatorWorkMonitorApi';
import styles from './PersonnelMonitor.module.css';

type StatusFilter = 'all' | 'linked' | 'unlinked';

const formatMins = (m: number): string =>
  `${Math.floor(m / 60)} ч ${String(m % 60).padStart(2, '0')} мин`;

const fullName = (e: WorkMonitorOperatorDto): string => `${e.lastName} ${e.firstName}`;

/**
 * Сколько времени прошло с момента привязки (в минутах).
 * Для непривязанных операторов — 0.
 */
const currentDurationMinutes = (e: WorkMonitorOperatorDto): number => {
  if (!e.boundAt) return 0;
  const bound = new Date(e.boundAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - bound) / 60000));
};

const PersonnelMonitor: React.FC = () => {
  const { operators, loading, error } = useOperatorWorkMonitor();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const linkedCount = useMemo(
    () => operators.filter((e) => e.isBound).length,
    [operators]
  );

  const rows = useMemo(() => {
    return operators
      .filter((e) => {
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'linked' && e.isBound) ||
          (statusFilter === 'unlinked' && !e.isBound);
        const fullName = `${e.lastName} ${e.firstName}`.toLowerCase();
        const matchesSearch =
          fullName.includes(searchTerm.toLowerCase()) ||
          e.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.firstName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => fullName(a).localeCompare(fullName(b), 'ru'));
  }, [operators, searchTerm, statusFilter]);

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (error) {
    return <div className={styles.error}>Ошибка: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Монитор персонала</h2>
      </div>

      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>МОНИТОР ПЕРСОНАЛА · ТЕКУЩИЕ ПРИВЯЗКИ</span>
        <span className={styles.meta}>
          {new Date().toLocaleDateString('ru-RU')}
        </span>
      </div>

      <div className={styles.summary}>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statName}>Всего операторов</div>
            <div className={styles.statNum}>{operators.length}</div>
          </div>
          <span className={styles.statIcon}>♟</span>
        </div>
        <div className={`${styles.statCard} ${styles.statGood}`}>
          <div>
            <div className={styles.statName}>Привязаны к рабочим местам</div>
            <div className={`${styles.statNum} ${styles.statGoodText}`}>{linkedCount}</div>
          </div>
          <span className={styles.statIcon}>✓</span>
        </div>
        <div className={`${styles.statCard} ${styles.statRed}`}>
          <div>
            <div className={styles.statName}>Не привязаны</div>
            <div className={`${styles.statNum} ${styles.statRedText}`}>
              {operators.length - linkedCount}
            </div>
          </div>
          <span className={styles.statIcon}>⊘</span>
        </div>
      </div>

      <div className={styles.tools}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск оператора по ФИО..."
            className={styles.searchInput}
          />
        </div>
        <div className={styles.segmented}>
          <button
            className={`${styles.segmentBtn} ${statusFilter === 'all' ? styles.segmentActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Все
          </button>
          <button
            className={`${styles.segmentBtn} ${statusFilter === 'linked' ? styles.segmentActive : ''}`}
            onClick={() => setStatusFilter('linked')}
          >
            Привязаны
          </button>
          <button
            className={`${styles.segmentBtn} ${statusFilter === 'unlinked' ? styles.segmentActive : ''}`}
            onClick={() => setStatusFilter('unlinked')}
          >
            Не привязаны
          </button>
        </div>
        <span className={styles.shownCount}>Найдено: {rows.length}</span>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.headerCell}>Оператор</th>
              <th className={styles.headerCell}>Статус</th>
              <th className={styles.headerCell}>Производственный этап</th>
              <th className={styles.headerCell}>Рабочее место</th>
              <th className={styles.headerCell}>№</th>
              <th className={styles.headerCell}>Начало текущей</th>
              <th className={styles.headerCell}>Время за сегодня</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>
                  Нет операторов, соответствующих фильтрам
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr key={e.userId} className={styles.row}>
                  <td className={styles.cell}>
                    <span className={styles.avatar}>{e.initials}</span>
                    <b>{e.lastName} {e.firstName}</b>
                  </td>
                  <td className={styles.cell}>
                    <span
                      className={`${styles.tag} ${e.isBound ? styles.tagOn : styles.tagOff}`}
                    >
                      {e.isBound ? '● Привязан' : '○ Не привязан'}
                    </span>
                  </td>
                  <td className={styles.cell}>{e.stageName ?? '—'}</td>
                  <td className={styles.cell}>{e.machineName ?? '—'}</td>
                  <td className={styles.cell}>{e.operatorNumber != null ? `№ ${e.operatorNumber}` : '—'}</td>
                  <td className={styles.cell}>
                    {e.boundAt ? new Date(e.boundAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className={styles.cellRight}>
                    <b>{e.isBound ? formatMins(currentDurationMinutes(e)) : '—'}</b>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersonnelMonitor;

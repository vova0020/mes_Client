import React, { useState, useMemo, useCallback } from 'react';
import styles from './PersonnelStatistics.module.css';
import { useOperatorProductivity, useOperators, useStages, useMachines } from '../../../../../../hooks/statisticsHook';
import { exportPersonnelToExcel } from './utils/exportPersonnelToExcel';

interface FilterState {
  dateFrom: string;
  dateTo: string;
  search: string;
  operatorId: number | '';
  machineId: number | '';
  stageId: number | '';
}

type QuickPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const PersonnelStatistics: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    search: '',
    operatorId: '',
    machineId: '',
    stageId: '',
  });

  const [activePeriod, setActivePeriod] = useState<QuickPeriod | null>(null);

  const { operators } = useOperators();
  const { stages } = useStages();
  const { machines } = useMachines();

  const params = useMemo(() => {
    const p: Record<string, string | number> = {};
    if (filters.dateFrom) p.startDate = filters.dateFrom;
    if (filters.dateTo) p.endDate = filters.dateTo;
    if (filters.search.trim()) p.search = filters.search.trim();
    if (filters.operatorId !== '') p.operatorId = filters.operatorId;
    if (filters.machineId !== '') p.machineId = filters.machineId;
    if (filters.stageId !== '') p.stageId = filters.stageId;
    return p;
  }, [filters.dateFrom, filters.dateTo, filters.search, filters.operatorId, filters.machineId, filters.stageId]);

  const { records, loading, error } = useOperatorProductivity(params);

  const handleQuickPeriod = (id: QuickPeriod) => {
    if (id === 'custom') {
      setActivePeriod('custom');
      return;
    }
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = end;
    if (id === 'yesterday') {
      const d = new Date(today.getTime() - 24 * 3600 * 1000);
      start = d.toISOString().split('T')[0];
    } else if (id === 'week') {
      const d = new Date(today.getTime() - 6 * 24 * 3600 * 1000);
      start = d.toISOString().split('T')[0];
    } else if (id === 'month') {
      const d = new Date(today.getTime() - 29 * 24 * 3600 * 1000);
      start = d.toISOString().split('T')[0];
    }
    setActivePeriod(id);
    setFilters((f) => ({ ...f, dateFrom: start, dateTo: end }));
  };

  const handleReset = () => {
    setFilters({ dateFrom: '', dateTo: '', search: '', operatorId: '', machineId: '', stageId: '' });
    setActivePeriod(null);
  };

  const formatSeconds = (s: number) => {
    const total = Math.round(s / 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h} ч ${String(m).padStart(2, '0')} мин`;
  };

  const num = (n: number) =>
    Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  const formatOperatorNumbers = (numbers: number[] | undefined) => {
    if (!numbers || numbers.length === 0) return '—';
    return numbers.map((n) => num(n)).join(', ');
  };

  // KPI
  const totalAuthorizedSeconds = useMemo(
    () => records.reduce((sum, r) => sum + (r.totalAuthorizedSeconds || 0), 0),
    [records]
  );

  const unitSums = useMemo(() => {
    const sums: Record<string, number> = {};
    records.forEach((rec) => {
      rec.machines.forEach((m) => {
        const unit = m.loadUnit || 'шт.';
        sums[unit] = (sums[unit] || 0) + (m.quantityProcessed || 0);
      });
    });
    return sums;
  }, [records]);

  // Экспорт в Excel
  const handleExport = useCallback(() => {
    exportPersonnelToExcel({
      records,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      totalAuthorizedSeconds,
      unitSums,
    });
  }, [records, filters.dateFrom, filters.dateTo, totalAuthorizedSeconds, unitSums]);

  const hasFilters =
    filters.search || filters.operatorId !== '' || filters.machineId !== '' || filters.stageId !== '';

  return (
    <div className={styles.container}>
      {/* Панель управления — первая строка: период + экспорт */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={styles.label}>Период:</span>
        </div>

        <div className={styles.dateRangeButtons}>
          <button
            className={activePeriod === 'today' ? styles.rangeButtonActive : styles.rangeButton}
            onClick={() => handleQuickPeriod('today')}
          >
            Сегодня
          </button>
          <button
            className={activePeriod === 'yesterday' ? styles.rangeButtonActive : styles.rangeButton}
            onClick={() => handleQuickPeriod('yesterday')}
          >
            Вчера
          </button>
          <button
            className={activePeriod === 'week' ? styles.rangeButtonActive : styles.rangeButton}
            onClick={() => handleQuickPeriod('week')}
          >
            Неделя
          </button>
          <button
            className={activePeriod === 'month' ? styles.rangeButtonActive : styles.rangeButton}
            onClick={() => handleQuickPeriod('month')}
          >
            Месяц
          </button>
          <button
            className={activePeriod === 'custom' ? styles.rangeButtonActive : styles.rangeButton}
            onClick={() => handleQuickPeriod('custom')}
          >
            Свои даты
          </button>
        </div>

        {activePeriod === 'custom' && (
          <div className={styles.customDateRange}>
            <input
              type="date"
              className={styles.dateInput}
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            />
            <span className={styles.dateSeparator}>—</span>
            <input
              type="date"
              className={styles.dateInput}
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            />
          </div>
        )}

        {records.length > 0 && (
          <button
            className={styles.exportButton}
            onClick={handleExport}
          >
            📥 Экспорт в Excel
          </button>
        )}
      </div>

      {/* Панель управления — вторая строка: фильтры */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={styles.label}>Поиск:</span>
          <input
            type="text"
            className={styles.textInput}
            placeholder="ФИО оператора"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>

        <div className={styles.controlGroup}>
          <span className={styles.label}>Этап:</span>
          <select
            className={styles.select}
            value={filters.stageId}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                stageId: e.target.value === '' ? '' : Number(e.target.value),
              }))
            }
          >
            <option value="">Все этапы</option>
            {stages.map((s) => (
              <option key={s.stageId} value={s.stageId}>
                {s.stageName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <span className={styles.label}>Станок:</span>
          <select
            className={styles.select}
            value={filters.machineId}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                machineId: e.target.value === '' ? '' : Number(e.target.value),
              }))
            }
          >
            <option value="">Все станки</option>
            {machines.map((m) => (
              <option key={m.machineId} value={m.machineId}>
                {m.machineName} ({m.machineCode})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <span className={styles.label}>Оператор:</span>
          <select
            className={styles.select}
            value={filters.operatorId}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                operatorId: e.target.value === '' ? '' : Number(e.target.value),
              }))
            }
          >
            <option value="">Все операторы</option>
            {operators.map((o) => (
              <option key={o.userId} value={o.userId}>
                {o.fullName}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button className={styles.resetButton} onClick={handleReset}>
            ✕ Сбросить
          </button>
        )}
      </div>

      {/* Отчёт */}
      <div className={styles.report}>
        {loading && (
          <div className={styles.empty}>
            <div className={styles.emptyIco}>⏳</div>
            <h3>Загрузка данных…</h3>
          </div>
        )}

        {!loading && error && (
          <div className={styles.empty}>
            <div className={styles.emptyIco}>⚠️</div>
            <h3>Ошибка загрузки</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIco}>📋</div>
            <h3>Данные не найдены</h3>
            <p>
              По выбранным параметрам нет записей о выработке операторов.
              Попробуйте расширить период или снять фильтры.
            </p>
            <div className={styles.note}>
              Убедитесь, что в выбранном периоде есть авторизации операторов и подтверждённый выпуск.
            </div>
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <>
            {/* Период */}
            <div className={styles.dateRangeInfo}>
              Период: {filters.dateFrom || '—'} — {filters.dateTo || '—'}
              {filters.search ? ` · поиск: ${filters.search}` : ''}
            </div>

            {/* KPI карточки */}
            <div className={styles.kpis}>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Сотрудников в отчёте</div>
                <div className={styles.kpiNum}>{records.length}</div>
                <div className={styles.minor}>С авторизацией за выбранный период</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Время авторизации</div>
                <div className={styles.kpiNum}>{formatSeconds(totalAuthorizedSeconds)}</div>
                <div className={styles.minor}>Сумма времени по операторам</div>
              </div>
              <div className={styles.kpiWide}>
                <div className={styles.kpiLabel}>Фактический выпуск по единицам измерения</div>
                <div className={styles.metricSet}>
                  {Object.entries(unitSums).map(([unit, qty]) => (
                    <div key={unit} className={styles.metricPill}>
                      <strong>{num(qty)} {unit}</strong>
                      <small>Всего выпущено</small>
                    </div>
                  ))}
                </div>
                <div className={styles.minor}>
                  Выпуск учитывается по станкам в единице измерения станка
                </div>
              </div>
            </div>

            {/* Таблица */}
            <div className={styles.tableCard}>
              <div className={styles.tableHead}>
                <div>
                  <h3>Выработка сотрудников</h3>
                  <div className={styles.note}>
                    Период: {filters.dateFrom || '—'} — {filters.dateTo || '—'}
                  </div>
                </div>
                <span className={styles.chip}>
                  {records.length} {records.length === 1 ? 'оператор' : 'операторов'}
                </span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.datatable}>
                  <colgroup>
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '16%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th colSpan={2}>Оператор / Рабочее место</th>
                      <th className={styles.num}>Выпуск</th>
                      <th className={styles.num}>Ед. изм.</th>
                      <th className={styles.num}>Время привязки</th>
                      <th className={styles.num}>Привязок</th>
                      <th className={styles.num}>№</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec) => (
                      <React.Fragment key={rec.operatorId}>
                        <tr className={styles.groupRow}>
                          <td colSpan={2}>
                            {rec.operatorName}
                            <span className={styles.groupStats}>
                              {formatSeconds(rec.totalAuthorizedSeconds)} · {rec.bindingCount} привязок ·{' '}
                              {num(rec.totalQuantity)} {rec.machines[0]?.loadUnit ?? ''}
                            </span>
                          </td>
                          <td />
                          <td />
                          <td />
                          <td />
                          <td />
                        </tr>
                        {rec.machines.map((m) => (
                          <tr key={m.machineId}>
                            <td className={styles.indent}>
                              {m.machineName || <span className={styles.zero}>—</span>}
                            </td>
                            <td className={styles.num}>
                              {m.machineCode || <span className={styles.zero}>—</span>}
                            </td>
                            <td className={styles.num}>{num(m.quantityProcessed)}</td>
                            <td className={styles.num}>
                              {m.loadUnit || <span className={styles.zero}>—</span>}
                            </td>
                            <td className={styles.num}>
                              <span className={styles.blueVal}>{formatSeconds(m.authorizedSeconds)}</span>
                            </td>
                            <td className={styles.num}>
                              <span className={styles.teamVal}>{m.bindingCount}</span>
                            </td>
                            <td className={styles.num}>{formatOperatorNumbers(m.operatorNumbers)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.footBar}>
                <span>Показано: {records.length} операторов</span>
                <span>
                  Время — по суммарной авторизации (привязке к станкам). Выпуск — в единицах измерения станка.
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PersonnelStatistics;

import React, { useState, useMemo } from 'react';
import styles from './PersonnelStatistics.module.css';
import { useOperatorProductivity } from '../../../../../../hooks/statisticsHook';
import { OperatorProductivityRecord } from '../../../../../../api/statisticsApi';

interface FilterState {
  dateFrom: string;
  dateTo: string;
  search: string;
}

const quickPeriods = [
  { id: 'today', label: 'Сегодня' },
  { id: 'yesterday', label: 'Вчера' },
  { id: 'week', label: '7 дней' },
  { id: 'month', label: '30 дней' },
];

const PersonnelStatistics: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  const params = useMemo(() => {
    const p: Record<string, string | number> = {};
    if (filters.dateFrom) p.startDate = filters.dateFrom;
    if (filters.dateTo) p.endDate = filters.dateTo;
    if (filters.search.trim()) p.search = filters.search.trim();
    return p;
  }, [filters.dateFrom, filters.dateTo, filters.search]);

  const { records, loading, error } = useOperatorProductivity(params);

  const handleQuickPeriod = (id: string) => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = end;
    if (id === 'yesterday') {
      start = new Date(today.getTime() - 24 * 3600 * 1000).toISOString().split('T')[0];
    } else if (id === 'week') {
      start = new Date(today.getTime() - 6 * 24 * 3600 * 1000).toISOString().split('T')[0];
    } else if (id === 'month') {
      start = new Date(today.getTime() - 29 * 24 * 3600 * 1000).toISOString().split('T')[0];
    }
    setFilters((f) => ({ ...f, dateFrom: start, dateTo: end }));
  };

  const handleReset = () => {
    setFilters({ dateFrom: '', dateTo: '', search: '' });
  };

  const formatSeconds = (s: number) => {
    const total = Math.round(s / 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h} ч ${String(m).padStart(2, '0')} мин`;
  };

  const num = (n: number) =>
    Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  // KPI: суммарное время авторизации
  const totalAuthorizedSeconds = useMemo(
    () => records.reduce((sum, r) => sum + (r.totalAuthorizedSeconds || 0), 0),
    [records]
  );

  // KPI: фактический выпуск по единицам измерения (по станкам операторов)
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

  return (
    <div className={styles.container}>
      {/* Заголовок экрана */}
      <div className={styles.screenTitle}>
        <strong>▥ &nbsp; Выработка персонала</strong>
        <span>
          Операторы · индивидуальная и бригадная эффективность{' '}
          <span className={styles.highlight}>●</span>
        </span>
      </div>

      {/* Панель фильтров */}
      <section className={styles.filterPanel}>
        <div className={styles.filterHead}>
          <b>Фильтры отчёта</b>
          <small>Данные загружаются автоматически после задания параметров</small>
        </div>

        <div className={styles.filterLayout}>
          <div className={styles.formGroup}>
            <label>Период <span className={styles.required}>*</span></label>
            <div className={styles.periodLine}>
              <input
                type="date"
                className={styles.dateInput}
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                aria-label="Период с"
              />
              <span className={styles.dash}>—</span>
              <input
                type="date"
                className={styles.dateInput}
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                aria-label="Период по"
              />
            </div>
            <div className={styles.quickRow}>
              {quickPeriods.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.quickBtn}
                  onClick={() => handleQuickPeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="search">Поиск по ФИО</label>
            <input
              id="search"
              type="text"
              className={styles.dateInput}
              style={{ minWidth: 0 }}
              placeholder="Например, Иванов"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Действия</label>
            <button
              type="button"
              className={styles.button}
              onClick={handleReset}
              style={{ marginTop: 4 }}
            >
              Сбросить фильтры
            </button>
          </div>
        </div>
      </section>

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
            <div className={styles.emptyIco}>▤</div>
            <h3>Данные не найдены</h3>
            <p>
              По выбранным параметрам нет записей о выработке операторов.
              Попробуйте расширить период или снять поиск по ФИО.
            </p>
            <div className={styles.note}>
              Убедитесь, что в выбранном периоде есть авторизации операторов и подтверждённый выпуск.
            </div>
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className={styles.result}>
            <div className={styles.kpis}>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>СОТРУДНИКОВ В ОТЧЁТЕ</div>
                <div className={styles.kpiNum}>{records.length}</div>
                <div className={styles.minor}>С авторизацией за выбранный период</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>ВРЕМЯ АВТОРИЗАЦИИ</div>
                <div className={styles.kpiNum}>{formatSeconds(totalAuthorizedSeconds)}</div>
                <div className={styles.minor}>Сумма времени по операторам</div>
              </div>
              <div className={styles.kpiWide}>
                <div className={styles.kpiLabel}>ФАКТИЧЕСКИЙ ВЫПУСК ПО ЕДИНИЦАМ ИЗМЕРЕНИЯ</div>
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

            <div className={styles.tableCard}>
              <div className={styles.tableHead}>
                <div>
                  <h3>Выработка сотрудников</h3>
                  <div className={styles.note}>
                    Период: {filters.dateFrom || '—'} — {filters.dateTo || '—'}
                    {filters.search ? ` · поиск: ${filters.search}` : ''}
                  </div>
                </div>
                <span className={styles.chip}>
                  {records.length} {records.length === 1 ? 'оператор' : 'операторов'}
                </span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.datatable}>
                  <colgroup>
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th colSpan={2}>Оператор</th>
                      <th className={styles.num}>Рабочее место</th>
                      <th className={styles.num}>Выпуск</th>
                      <th className={styles.num}>Привязок</th>
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
                        </tr>
                        {rec.machines.map((m) => (
                          <tr className={styles.dataRow} key={m.machineId}>
                            <td className={styles.indent}>{m.machineName}</td>
                            <td className={styles.num}>{m.machineCode}</td>
                            <td className={styles.num}>{num(m.quantityProcessed)}</td>
                            <td className={styles.num}>{m.loadUnit}</td>
                            <td className={styles.num}>{m.bindingCount}</td>
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
          </div>
        )}
      </div>

      <p className={styles.disclaimer}>
        Источник данных — эндпоинт /statistics/operator-productivity. Время авторизации рассчитывается
        из суммарных секунд привязки к станкам за выбранный период.
      </p>
    </div>
  );
};

export default PersonnelStatistics;

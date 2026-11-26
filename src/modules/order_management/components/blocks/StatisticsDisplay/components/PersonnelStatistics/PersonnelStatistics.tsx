import React, { useState } from 'react';
import styles from './PersonnelStatistics.module.css';

// Типы данных, соответствующие структуре отчёта из макета FIT-MES
interface PersonnelReportRow {
  wid: string;
  name: string;
  machine: string;
  stage: string;
  unit: string;
  mins: number;
  soloMins: number;
  teamMins: number;
  personal: number;
  team: number;
  soloRate: number | null;
  brigadeRate: number | null;
}

interface PersonnelReport {
  rows: PersonnelReportRow[];
  people: number;
  time: number;
  unitSums: Record<string, number>;
}

interface PersonnelStatisticsProps {
  onBack?: () => void;
}

const PersonnelStatistics: React.FC<PersonnelStatisticsProps> = ({ onBack }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [machineFilter, setMachineFilter] = useState('all');
  const [isReportBuilt, setIsReportBuilt] = useState(false);

  // Демонстрационные данные (без подключения к реальным данным)
  const workers = [
    'Назаров Алексей',
    'Смирнов Анатолий',
    'Шоханов Дмитрий',
    'Саркисян Сергей',
    'Петров Виктор',
    'Иванов Максим',
    'Кузнецов Олег',
    'Фёдорова Елена',
    'Ильин Максим',
    'Борисов Антон',
  ];

  const stages = ['Раскрой ЛДСП', 'Присадка', 'Кромкооблицовка', 'Упаковка'];

  const machines = [
    'KDT Двухголовый',
    'Большая пила',
    'SKIPPER №2',
    'Валерий 3000',
    'KOT проходной',
    'Упаковка №1',
    'Викки',
  ];

  const quickPeriods = [
    { id: 'today', label: 'Сегодня' },
    { id: 'yesterday', label: 'Вчера' },
    { id: 'week', label: '7 дней' },
    { id: 'month', label: '30 дней' },
  ];

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
    setDateFrom(start);
    setDateTo(end);
  };

  const handleBuildReport = () => {
    if (dateFrom && dateTo) {
      setIsReportBuilt(true);
    }
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setWorkerFilter('all');
    setStageFilter('all');
    setMachineFilter('all');
    setIsReportBuilt(false);
  };

  const formatMins = (n: number) => {
    const v = Math.round(n);
    const h = Math.floor(v / 60);
    const m = v % 60;
    return `${h} ч ${String(m).padStart(2, '0')} мин`;
  };

  const num = (n: number) =>
    Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 1 });

  const unitSums: Record<string, number> = {
    'м²': 1245.6,
    'шт.': 3872,
    'пог. м': 2134.2,
    'компл.': 956,
  };

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
          <small>Сначала задайте период, затем сформируйте отчёт</small>
        </div>

        <div className={styles.filterLayout}>
          <div className={styles.formGroup}>
            <label>
              Период <span className={styles.required}>*</span>
            </label>
            <div className={styles.periodLine}>
              <input
                type="date"
                className={styles.dateInput}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Период с"
              />
              <span className={styles.dash}>—</span>
              <input
                type="date"
                className={styles.dateInput}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
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
            <label htmlFor="worker">Сотрудник</label>
            <select
              id="worker"
              className={styles.select}
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
            >
              <option value="all">Все сотрудники</option>
              {workers.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="stage">Производственный этап</label>
            <select
              id="stage"
              className={styles.select}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="all">Все этапы</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="machine">Рабочее место</label>
            <select
              id="machine"
              className={styles.select}
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
            >
              <option value="all">Все рабочие места</option>
              {machines.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.actionLeft}>
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              onClick={handleBuildReport}
              disabled={!(dateFrom && dateTo)}
            >
              ▤ &nbsp; Сформировать отчёт
            </button>
            <button type="button" className={styles.button} onClick={handleReset}>
              Сбросить фильтры
            </button>
            <span className={styles.statusHint}>
              {dateFrom && dateTo ? 'Параметры выбраны · отчёт не сформирован' : 'Период не выбран'}
            </span>
          </div>
          <div className={styles.actionRight}>
            <button
              type="button"
              className={`${styles.button} ${styles.excel}`}
              disabled={!isReportBuilt}
            >
              ▣ &nbsp; Экспорт в Excel
            </button>
          </div>
        </div>
      </section>

      {/* Отчёт */}
      <div className={styles.report}>
        {/* Состояние: отчёт не сформирован */}
        {!isReportBuilt && (
          <div className={styles.empty}>
            <div className={styles.emptyIco}>▤</div>
            <h3>Отчёт пока не сформирован</h3>
            <p>
              Выберите период и при необходимости сотрудника, этап или рабочее место. Затем
              нажмите «Сформировать отчёт».
            </p>
            <div className={styles.note}>
              До формирования отчёта таблица и сводные показатели не отображаются, экспорт в Excel
              недоступен.
            </div>
          </div>
        )}

        {/* Состояние: отчёт сформирован */}
        {isReportBuilt && (
          <div className={styles.result}>
            <div className={styles.kpis}>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>СОТРУДНИКОВ В ОТЧЁТЕ</div>
                <div className={styles.kpiNum}>10</div>
                <div className={styles.minor}>С авторизацией за выбранный период</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>ВРЕМЯ АВТОРИЗАЦИИ</div>
                <div className={styles.kpiNum}>152 ч 30 мин</div>
                <div className={styles.minor}>Сумма времени по сотрудникам</div>
              </div>
              <div className={styles.kpiWide}>
                <div className={styles.kpiLabel}>
                  ФАКТИЧЕСКИЙ ВЫПУСК ПО ЕДИНИЦАМ ИЗМЕРЕНИЯ
                </div>
                <div className={styles.metricSet}>
                  {Object.entries(unitSums).map(([unit, qty]) => (
                    <div key={unit} className={styles.metricPill}>
                      <strong>
                        {num(qty)} {unit}
                      </strong>
                      <small>Всего выпущено</small>
                    </div>
                  ))}
                </div>
                <div className={styles.minor}>
                  Бригадный выпуск учитывается в общих итогах один раз
                </div>
              </div>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableHead}>
                <div>
                  <h3>Выработка сотрудников</h3>
                  <div className={styles.note}>
                    Период: {dateFrom} — {dateTo} · {stages.find((s) => s === stageFilter) ?? 'Все этапы'} ·{' '}
                    {machines.find((m) => m === machineFilter) ?? 'Все рабочие места'}
                  </div>
                </div>
                <span className={styles.chip}>10 сотрудников · 24 строк</span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.datatable}>
                  <colgroup>
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '9%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Рабочее место</th>
                      <th>Этап</th>
                      <th className={styles.num}>Всего авториз.</th>
                      <th className={styles.num}>Один</th>
                      <th className={styles.num}>В бригаде</th>
                      <th className={styles.num}>Личный выпуск</th>
                      <th className={styles.num}>С участием в бригаде</th>
                      <th className={styles.num}>Личная/ч</th>
                      <th className={styles.num}>Бригада/чел.-ч</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w, idx) => (
                      <React.Fragment key={w}>
                        {idx === 0 || idx === 3 ? (
                          <tr className={styles.groupRow}>
                            <td colSpan={9}>
                              ▾ &nbsp; {w}
                              <span className={styles.groupStats}>
                                {formatMins(480 + idx * 30)} · {idx === 0 ? 2 : 1} рабочих места
                              </span>
                            </td>
                          </tr>
                        ) : null}
                        <tr className={styles.dataRow}>
                          <td className={styles.indent}>
                            {machines[(idx + 2) % machines.length]}
                          </td>
                          <td>
                            {stages[(idx + 1) % stages.length]}
                          </td>
                          <td className={styles.num}>{formatMins(420 + idx * 12)}</td>
                          <td className={styles.num}>{formatMins(200 + idx * 8)}</td>
                          <td className={styles.num}>{formatMins(120 + idx * 5)}</td>
                          <td className={styles.num}>
                            <span className={styles.greenVal}>{num(120 + idx * 7)}</span>{' '}
                            <span className={styles.kind}>м²</span>
                          </td>
                          <td className={styles.num}>
                            {idx % 2 === 0 ? (
                              <>
                                <span className={styles.teamVal}>{num(90 + idx * 4)}</span>{' '}
                                <span className={styles.kind}>м²</span>
                              </>
                            ) : (
                              <span className={styles.zero}>—</span>
                            )}
                          </td>
                          <td className={styles.num}>
                            {idx % 3 === 0 ? (
                              <>
                                <span className={styles.blueVal}>{num(8.5 + idx * 0.4)}</span>{' '}
                                <span className={styles.kind}>м²/ч</span>
                              </>
                            ) : (
                              <span className={styles.zero}>—</span>
                            )}
                          </td>
                          <td className={styles.num}>
                            {idx % 2 === 0 ? (
                              <>
                                <span className={styles.teamVal}>{num(7.2 + idx * 0.3)}</span>{' '}
                                <span className={styles.kind}>м²/чел.-ч</span>
                              </>
                            ) : (
                              <span className={styles.zero}>—</span>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.footBar}>
                <span>Показано: 24 записей по рабочим местам</span>
                <span>
                  Время — по авторизации, включая перерывы. Бригадный показатель — общий для
                  участников.
                </span>
              </div>
            </div>

            <div className={styles.warning}>
              Личная/ч = личный выпуск ÷ часы{' '}
              <b>одиночной</b> авторизации. Бригада/чел.-ч = уникальный выпуск команды ÷ сумма часов{' '}
              <b>совместной</b> авторизации всех её участников. Это показатель бригады, не личный
              вклад помощника. При неоднозначном составе значение «—». Выпуск команды не суммируйте
              по участникам.
            </div>
          </div>
        )}
      </div>

      <p className={styles.disclaimer}>
        Демонстрационный макет, не подключённый к базе FIT-MES. Открытые сессии в примерах
        рассчитаны на момент условного среза. В рабочей системе время открытой авторизации следует
        рассчитывать на момент формирования отчёта.
      </p>
    </div>
  );
};

export default PersonnelStatistics;

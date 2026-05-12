import React, { useState, useEffect } from 'react';
import styles from './DefectAnalysisModal.module.css';
import {
  DefectDetail,
  getDefectStatistics,
  getFilterOptions,
  getMachineProduction,
  MachineProductionRecord,
  OrderFilterOption,
  MaterialFilterOption,
  MachineFilterOption,
  StageFilterOption,
} from '../../../../api/orderManagementApi/defectStatisticsApi';

type ActiveTab = 'defects' | 'production';

interface DefectAnalysisModalProps {
  onClose: () => void;
}

const DefectAnalysisModal: React.FC<DefectAnalysisModalProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('defects');

  // ─── Общие данные фильтров ───────────────────────────────────────────────
  const [machines, setMachines] = useState<MachineFilterOption[]>([]);
  const [stages, setStages] = useState<StageFilterOption[]>([]);
  const [orders, setOrders] = useState<OrderFilterOption[]>([]);
  const [materials, setMaterials] = useState<MaterialFilterOption[]>([]);

  // ─── Вкладка «Анализ брака» ──────────────────────────────────────────────
  const [defectLoading, setDefectLoading] = useState(false);
  const [defectRecords, setDefectRecords] = useState<DefectDetail[]>([]);
  const [defectDateFrom, setDefectDateFrom] = useState('');
  const [defectDateTo, setDefectDateTo] = useState('');
  const [defectSelectedMaterial, setDefectSelectedMaterial] = useState<number | ''>('');
  const [defectSelectedMachine, setDefectSelectedMachine] = useState<number | ''>('');
  const [defectSelectedStage, setDefectSelectedStage] = useState<number | ''>('');
  const [defectSelectedOrder, setDefectSelectedOrder] = useState<number | ''>('');

  // ─── Вкладка «Учёт выпуска продукции» ───────────────────────────────────
  const [prodLoading, setProdLoading] = useState(false);
  const [prodRecords, setProdRecords] = useState<MachineProductionRecord[]>([]);
  const [prodDateFrom, setProdDateFrom] = useState('');
  const [prodDateTo, setProdDateTo] = useState('');
  const [prodSelectedMachine, setProdSelectedMachine] = useState<number | ''>('');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    loadFilterOptions();
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  };

  // ─── Загрузка опций фильтров ─────────────────────────────────────────────
  const loadFilterOptions = async () => {
    try {
      const data = await getFilterOptions();
      setOrders(data.orders);
      setMaterials(data.materials);
      setMachines(data.machines);
      setStages(data.stages);
    } catch (error) {
      console.error('Ошибка загрузки опций фильтров:', error);
    }
  };

  // ─── Анализ брака: применить фильтры ────────────────────────────────────
  const applyDefectFilters = async () => {
    setDefectLoading(true);
    try {
      const params: any = {};
      if (defectDateFrom) params.startDate = defectDateFrom;
      if (defectDateTo) params.endDate = defectDateTo;
      if (defectSelectedMaterial) params.materialId = Number(defectSelectedMaterial);
      if (defectSelectedMachine) params.machineId = Number(defectSelectedMachine);
      if (defectSelectedStage) params.stageId = Number(defectSelectedStage);
      if (defectSelectedOrder) params.orderId = Number(defectSelectedOrder);
      const data = await getDefectStatistics(params);
      setDefectRecords(data);
    } catch (error) {
      console.error('Ошибка загрузки данных о браке:', error);
    } finally {
      setDefectLoading(false);
    }
  };

  const resetDefectFilters = () => {
    setDefectDateFrom('');
    setDefectDateTo('');
    setDefectSelectedMaterial('');
    setDefectSelectedMachine('');
    setDefectSelectedStage('');
    setDefectSelectedOrder('');
    setDefectRecords([]);
  };

  // ─── Учёт выпуска: применить фильтры ────────────────────────────────────
  const applyProdFilters = async () => {
    setProdLoading(true);
    try {
      const params: any = {};
      if (prodDateFrom) params.startDate = prodDateFrom;
      if (prodDateTo) params.endDate = prodDateTo;
      if (prodSelectedMachine) params.machineId = Number(prodSelectedMachine);
      const data = await getMachineProduction(params);
      setProdRecords(data);
    } catch (error) {
      console.error('Ошибка загрузки данных о выпуске:', error);
    } finally {
      setProdLoading(false);
    }
  };

  const resetProdFilters = () => {
    setProdDateFrom('');
    setProdDateTo('');
    setProdSelectedMachine('');
    setProdRecords([]);
  };

  // ─── Статистика брака ────────────────────────────────────────────────────
  const totalDefects = defectRecords.reduce((sum, r) => sum + r.defectQuantity, 0);
  const uniquePartsReturns = defectRecords.reduce((acc, r) => {
    if (!acc.has(r.partId)) acc.set(r.partId, r.totalReturnedQuantity);
    return acc;
  }, new Map<number, number>());
  const totalReturned = Array.from(uniquePartsReturns.values()).reduce((s, q) => s + q, 0);
  const totalLost = totalDefects - totalReturned;

  const defectsByMaterial = defectRecords.reduce((acc, r) => {
    if (r.materialName) acc[r.materialName] = (acc[r.materialName] || 0) + r.defectQuantity;
    return acc;
  }, {} as Record<string, number>);

  const defectsByMachine = defectRecords.reduce((acc, r) => {
    if (r.machineName) acc[r.machineName] = (acc[r.machineName] || 0) + r.defectQuantity;
    return acc;
  }, {} as Record<string, number>);

  const defectsByStage = defectRecords.reduce((acc, r) => {
    acc[r.stageName] = (acc[r.stageName] || 0) + r.defectQuantity;
    return acc;
  }, {} as Record<string, number>);

  // ─── Статистика выпуска ──────────────────────────────────────────────────
  const totalProdQty = prodRecords.reduce((sum, r) => sum + r.quantityProcessed, 0);
  const totalProdDuration = prodRecords.reduce((sum, r) => sum + r.durationSeconds, 0);

  // ─── Утилиты ─────────────────────────────────────────────────────────────
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  const formatTime = (date: Date | string) =>
    new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}ч ${m}м`;
    return `${m}м`;
  };

  return (
    <div
      className={`${styles.modalOverlay} ${isVisible ? styles.visible : ''}`}
      onClick={handleClose}
    >
      <div
        className={`${styles.modalContent} ${isVisible ? styles.slideIn : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Шапка ── */}
        <div className={styles.modalHeader}>
          <h3>📊 История обработки</h3>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        {/* ── Вкладки ── */}
        <div className={styles.tabsBar}>
          <button
            className={`${styles.tab} ${activeTab === 'defects' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('defects')}
          >
            🔴 Анализ брака
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'production' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('production')}
          >
            🟢 Учёт выпуска продукции
          </button>
        </div>

        <div className={styles.modalBody}>

          {/* ════════════════════════════════════════════════════════════════
              ВКЛАДКА 1 — АНАЛИЗ БРАКА
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'defects' && (
            <>
              <div className={styles.filtersSection}>
                <h4>🔍 Фильтры</h4>
                <div className={styles.filtersGrid}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Период с:</label>
                    <input
                      type="date"
                      value={defectDateFrom}
                      onChange={(e) => setDefectDateFrom(e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Период по:</label>
                    <input
                      type="date"
                      value={defectDateTo}
                      onChange={(e) => setDefectDateTo(e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Заказ:</label>
                    <select
                      value={defectSelectedOrder}
                      onChange={(e) => setDefectSelectedOrder(e.target.value ? Number(e.target.value) : '')}
                      className={styles.filterSelect}
                    >
                      <option value="">Все заказы</option>
                      {orders.map((o) => (
                        <option key={o.orderId} value={o.orderId}>
                          {o.batchNumber} — {o.orderName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Материал:</label>
                    <select
                      value={defectSelectedMaterial}
                      onChange={(e) => setDefectSelectedMaterial(e.target.value ? Number(e.target.value) : '')}
                      className={styles.filterSelect}
                    >
                      <option value="">Все материалы</option>
                      {materials.map((m) => (
                        <option key={m.materialId} value={m.materialId}>
                          {m.materialName} ({m.article})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Станок:</label>
                    <select
                      value={defectSelectedMachine}
                      onChange={(e) => setDefectSelectedMachine(e.target.value ? Number(e.target.value) : '')}
                      className={styles.filterSelect}
                    >
                      <option value="">Все станки</option>
                      {machines.map((m) => (
                        <option key={m.machineId} value={m.machineId}>
                          {m.machineName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Этап производства:</label>
                    <select
                      value={defectSelectedStage}
                      onChange={(e) => setDefectSelectedStage(e.target.value ? Number(e.target.value) : '')}
                      className={styles.filterSelect}
                    >
                      <option value="">Все этапы</option>
                      {stages.map((s) => (
                        <option key={s.stageId} value={s.stageId}>
                          {s.stageName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.filterActions}>
                  <button
                    onClick={applyDefectFilters}
                    disabled={defectLoading}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    {defectLoading ? '⏳ Загрузка...' : '🔍 Применить фильтры'}
                  </button>
                  <button
                    onClick={resetDefectFilters}
                    className={`${styles.button} ${styles.buttonSecondary}`}
                  >
                    🔄 Сбросить
                  </button>
                </div>
              </div>

              {defectRecords.length > 0 && (
                <>
                  <div className={styles.statisticsSection}>
                    <h4>📈 Общая статистика</h4>
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <div className={styles.statValue}>{totalDefects}</div>
                        <div className={styles.statLabel}>Всего отбраковано</div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statValue}>{totalReturned}</div>
                        <div className={styles.statLabel}>Возвращено в производство</div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statValue}>{totalLost}</div>
                        <div className={styles.statLabel}>Безвозвратный брак</div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statValue}>
                          {totalDefects > 0 ? ((totalReturned / totalDefects) * 100).toFixed(1) : 0}%
                        </div>
                        <div className={styles.statLabel}>Процент возврата</div>
                      </div>
                    </div>
                  </div>

                  {Object.keys(defectsByMaterial).length > 0 && (
                    <div className={styles.analysisSection}>
                      <h4>🎨 Брак по материалам</h4>
                      <div className={styles.analysisGrid}>
                        {Object.entries(defectsByMaterial)
                          .sort(([, a], [, b]) => b - a)
                          .map(([material, count]) => (
                            <div key={material} className={styles.analysisCard}>
                              <div className={styles.analysisLabel}>{material}</div>
                              <div className={styles.analysisValue}>{count} шт.</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(defectsByMachine).length > 0 && (
                    <div className={styles.analysisSection}>
                      <h4>⚙️ Брак по рабочим местам (станкам)</h4>
                      <div className={styles.analysisGrid}>
                        {Object.entries(defectsByMachine)
                          .sort(([, a], [, b]) => b - a)
                          .map(([machine, count]) => (
                            <div key={machine} className={styles.analysisCard}>
                              <div className={styles.analysisLabel}>{machine}</div>
                              <div className={styles.analysisValue}>{count} шт.</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(defectsByStage).length > 0 && (
                    <div className={styles.analysisSection}>
                      <h4>🏭 Брак по этапам производства</h4>
                      <div className={styles.analysisGrid}>
                        {Object.entries(defectsByStage)
                          .sort(([, a], [, b]) => b - a)
                          .map(([stage, count]) => (
                            <div key={stage} className={styles.analysisCard}>
                              <div className={styles.analysisLabel}>{stage}</div>
                              <div className={styles.analysisValue}>{count} шт.</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.detailsSection}>
                    <h4>📋 Детальная информация ({defectRecords.length} записей)</h4>
                    <div className={styles.tableWrapper}>
                      <table className={styles.defectTable}>
                        <thead>
                          <tr>
                            <th className={styles.thDate}>Дата</th>
                            <th className={styles.thOrder}>Заказ / Упаковка</th>
                            <th className={styles.thPart}>Деталь</th>
                            <th className={styles.thMaterial}>Материал</th>
                            <th className={styles.thQty}>Кол-во</th>
                            <th className={styles.thDefects}>Типы брака</th>
                            <th className={styles.thStage}>Этап / Станок</th>
                            <th className={styles.thWorker}>Обнаружил</th>
                            <th className={styles.thReturn}>Возврат</th>
                            <th className={styles.thNote}>Примечание</th>
                          </tr>
                        </thead>
                        <tbody>
                          {defectRecords.map((record) => (
                            <tr key={record.reclamationId}>
                              <td className={styles.tdDate}>
                                <div className={styles.dateCell}>
                                  {formatDate(record.detectedAt)}
                                  <span className={styles.timeCell}>
                                    {formatTime(record.detectedAt)}
                                  </span>
                                </div>
                              </td>
                              <td className={styles.tdOrder}>
                                {record.packages.length > 0 ? (
                                  <div className={styles.packagesCell}>
                                    {record.packages.map((pkg, idx) => (
                                      <div key={pkg.packageId} className={styles.packageItem}>
                                        {idx === 0 && (
                                          <>
                                            <div className={styles.cellMain}>№ {pkg.orderBatchNumber}</div>
                                            <div className={styles.cellSub}>{pkg.orderName}</div>
                                          </>
                                        )}
                                        <div className={styles.cellSub}>
                                          📦 {pkg.packageName} ({pkg.packageCode})
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : '-'}
                              </td>
                              <td className={styles.tdPart}>
                                <div className={styles.cellContent}>
                                  <div className={styles.cellMain}>{record.partCode}</div>
                                  <div className={styles.cellSub}>{record.partName}</div>
                                </div>
                              </td>
                              <td className={styles.tdMaterial}>
                                {record.materialName ? (
                                  <div className={styles.cellContent}>
                                    <div className={styles.cellMain}>{record.materialName}</div>
                                    <div className={styles.cellSub}>{record.materialSku}</div>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className={styles.tdQty}>
                                <div className={styles.qtyCell}>
                                  <span className={styles.defectBadge}>{record.defectQuantity}</span>
                                </div>
                              </td>
                              <td className={styles.tdDefects}>
                                <div className={styles.defectTypes}>
                                  {record.defectTypes.map((type, idx) => (
                                    <span key={idx} className={styles.defectType}>{type}</span>
                                  ))}
                                </div>
                              </td>
                              <td className={styles.tdStage}>
                                <div className={styles.cellContent}>
                                  <div className={styles.cellMain}>{record.stageName}</div>
                                  {record.machineName && (
                                    <div className={styles.cellSub}>{record.machineName}</div>
                                  )}
                                </div>
                              </td>
                              <td className={styles.tdWorker}>{record.reportedByName || '-'}</td>
                              <td className={styles.tdReturn}>
                                {record.returnEvents.length > 0 ? (
                                  <div className={styles.returnCell}>
                                    <div className={styles.returnHeader}>
                                      <span className={styles.returnBadge}>
                                        ✓ Возвращено: {record.totalReturnedQuantity} шт.
                                      </span>
                                      {record.returnEvents.length > 1 && (
                                        <span className={styles.returnCount}>
                                          {record.returnEvents.length}{' '}
                                          {record.returnEvents.length < 5 ? 'возврата' : 'возвратов'}
                                        </span>
                                      )}
                                    </div>
                                    <div className={styles.returnEventsList}>
                                      {record.returnEvents.map((event) => (
                                        <div key={event.movementId} className={styles.returnEvent}>
                                          <div className={styles.returnEventLine}>
                                            <span className={styles.returnEventQty}>{event.returnedQuantity} шт.</span>
                                            <span className={styles.returnEventDate}>{formatDate(event.returnedAt)}</span>
                                          </div>
                                          <div className={styles.returnEventStage}>
                                            → {event.returnToStageName || 'Не указан'}
                                          </div>
                                          {(event.returnToMachineName || event.returnPalletName) && (
                                            <div className={styles.returnEventDetails}>
                                              {event.returnToMachineName && <span>⚙️ {event.returnToMachineName}</span>}
                                              {event.returnPalletName && <span>📦 {event.returnPalletName}</span>}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className={styles.noReturn}>—</span>
                                )}
                              </td>
                              <td className={styles.tdNote}>
                                <div className={styles.noteCell}>{record.note || '—'}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {!defectLoading && defectRecords.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📊</div>
                  <div className={styles.emptyText}>
                    Выберите фильтры и нажмите «Применить фильтры» для анализа брака
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              ВКЛАДКА 2 — УЧЁТ ВЫПУСКА ПРОДУКЦИИ
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'production' && (
            <>
              <div className={styles.filtersSection}>
                <h4>🔍 Фильтры</h4>
                <div className={styles.filtersGrid}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Период с:</label>
                    <input
                      type="date"
                      value={prodDateFrom}
                      onChange={(e) => setProdDateFrom(e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Период по:</label>
                    <input
                      type="date"
                      value={prodDateTo}
                      onChange={(e) => setProdDateTo(e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Рабочее место (станок):</label>
                    <select
                      value={prodSelectedMachine}
                      onChange={(e) => setProdSelectedMachine(e.target.value ? Number(e.target.value) : '')}
                      className={styles.filterSelect}
                    >
                      <option value="">Все рабочие места</option>
                      {machines.map((m) => (
                        <option key={m.machineId} value={m.machineId}>
                          {m.machineName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.filterActions}>
                  <button
                    onClick={applyProdFilters}
                    disabled={prodLoading}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    {prodLoading ? '⏳ Загрузка...' : '🔍 Применить фильтры'}
                  </button>
                  <button
                    onClick={resetProdFilters}
                    className={`${styles.button} ${styles.buttonSecondary}`}
                  >
                    🔄 Сбросить
                  </button>
                </div>
              </div>

              {prodRecords.length > 0 && (
                <>
                  {/* Сводная статистика */}
                  <div className={styles.statisticsSection}>
                    <h4>📈 Общая статистика выпуска</h4>
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <div className={styles.statValue}>{prodRecords.length}</div>
                        <div className={styles.statLabel}>Операций выполнено</div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statValue}>{totalProdQty}</div>
                        <div className={styles.statLabel}>Деталей обработано</div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statValue}>{formatDuration(totalProdDuration)}</div>
                        <div className={styles.statLabel}>Суммарное время работы</div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statValue}>
                          {prodRecords.length > 0 ? Math.round(totalProdQty / prodRecords.length) : 0}
                        </div>
                        <div className={styles.statLabel}>Среднее кол-во за операцию</div>
                      </div>
                    </div>
                  </div>

                  {/* Детальная таблица выпуска */}
                  <div className={styles.detailsSection}>
                    <h4>📋 Журнал операций ({prodRecords.length} записей)</h4>
                    <div className={styles.tableWrapper}>
                      <table className={styles.prodTable}>
                        <thead>
                          <tr>
                            <th className={styles.thProdDate}>Начало / Конец</th>
                            <th className={styles.thProdMachine}>Станок / Этап</th>
                            <th className={styles.thProdOrder}>Заказ / Упаковка</th>
                            <th className={styles.thProdPart}>Деталь</th>
                            <th className={styles.thProdMaterial}>Материал</th>
                            <th className={styles.thProdPallet}>Поддон</th>
                            <th className={styles.thProdQty}>Кол-во</th>
                            <th className={styles.thProdDuration}>Время</th>
                            <th className={styles.thProdOperator}>Оператор</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prodRecords.map((record) => (
                            <tr key={record.operationId}>
                              <td className={styles.tdProdDate}>
                                <div className={styles.dateCell}>
                                  <span className={styles.prodDateStart}>
                                    {formatDate(record.startedAt)} {formatTime(record.startedAt)}
                                  </span>
                                  <span className={styles.prodDateEnd}>
                                    → {formatDate(record.completedAt)} {formatTime(record.completedAt)}
                                  </span>
                                </div>
                              </td>
                              <td className={styles.tdProdMachine}>
                                <div className={styles.cellContent}>
                                  <div className={styles.cellMain}>{record.machineName}</div>
                                  <div className={styles.cellSub}>{record.stageName}</div>
                                </div>
                              </td>
                              <td className={styles.tdProdOrder}>
                                {record.packages.length > 0 ? (
                                  <div className={styles.packagesCell}>
                                    {record.packages.map((pkg, idx) => (
                                      <div key={pkg.packageId} className={styles.packageItem}>
                                        {idx === 0 && (
                                          <>
                                            <div className={styles.cellMain}>№ {pkg.orderBatchNumber}</div>
                                            <div className={styles.cellSub}>{pkg.orderName}</div>
                                          </>
                                        )}
                                        <div className={styles.cellSub}>
                                          📦 {pkg.packageName} ({pkg.packageCode})
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : '-'}
                              </td>
                              <td className={styles.tdProdPart}>
                                <div className={styles.cellContent}>
                                  <div className={styles.cellMain}>{record.partCode}</div>
                                  <div className={styles.cellSub}>{record.partName}</div>
                                  {record.partSize && (
                                    <div className={styles.cellSub}>{record.partSize}</div>
                                  )}
                                </div>
                              </td>
                              <td className={styles.tdProdMaterial}>
                                {record.materialName ? (
                                  <div className={styles.cellContent}>
                                    <div className={styles.cellMain}>{record.materialName}</div>
                                    <div className={styles.cellSub}>{record.materialSku}</div>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className={styles.tdProdPallet}>
                                <div className={styles.cellContent}>
                                  <div className={styles.cellMain}>{record.palletName}</div>
                                </div>
                              </td>
                              <td className={styles.tdProdQty}>
                                <div className={styles.prodQtyCell}>
                                  <span className={styles.prodQtyBadge}>
                                    {record.quantityProcessed}
                                  </span>
                                  <span className={styles.prodUnit}>{record.machineLoadUnit}</span>
                                </div>
                              </td>
                              <td className={styles.tdProdDuration}>
                                <span className={styles.durationBadge}>
                                  {formatDuration(record.durationSeconds)}
                                </span>
                              </td>
                              <td className={styles.tdProdOperator}>
                                {record.operatorName || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {!prodLoading && prodRecords.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🏭</div>
                  <div className={styles.emptyText}>
                    Выберите период и рабочее место, затем нажмите «Применить фильтры»
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default DefectAnalysisModal;

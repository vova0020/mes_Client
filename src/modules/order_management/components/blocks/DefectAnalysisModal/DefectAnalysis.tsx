import React, { useState, useEffect } from 'react';
import styles from './DefectAnalysis.module.css';
import {
  DefectDetail,
  getDefectStatistics,
  getFilterOptions,
  OrderFilterOption,
  MaterialFilterOption,
  MachineFilterOption,
  StageFilterOption,
} from '../../../../api/orderManagementApi/defectStatisticsApi';

interface DefectAnalysisProps {
  onClose: () => void;
}

const DefectAnalysis: React.FC<DefectAnalysisProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<DefectDetail[]>([]);
  
  const [machines, setMachines] = useState<MachineFilterOption[]>([]);
  const [stages, setStages] = useState<StageFilterOption[]>([]);
  const [orders, setOrders] = useState<OrderFilterOption[]>([]);
  const [materials, setMaterials] = useState<MaterialFilterOption[]>([]);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<number | ''>('');
  const [selectedMachine, setSelectedMachine] = useState<number | ''>('');
  const [selectedStage, setSelectedStage] = useState<number | ''>('');
  const [selectedOrder, setSelectedOrder] = useState<number | ''>('');

  useEffect(() => {
    loadFilterOptions();
  }, []);

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

  const applyFilters = async () => {
    setLoading(true);
    setRecords([]);
    try {
      const params: any = {};
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      if (selectedMaterial) params.materialId = Number(selectedMaterial);
      if (selectedMachine) params.machineId = Number(selectedMachine);
      if (selectedStage) params.stageId = Number(selectedStage);
      if (selectedOrder) params.orderId = Number(selectedOrder);
      const data = await getDefectStatistics(params);
      setRecords(data);
    } catch (error) {
      console.error('Ошибка загрузки данных о браке:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedMaterial('');
    setSelectedMachine('');
    setSelectedStage('');
    setSelectedOrder('');
    setRecords([]);
  };

  const totalDefects = records.reduce((sum, r) => sum + r.defectQuantity, 0);
  const uniquePartsReturns = records.reduce((acc, r) => {
    if (!acc.has(r.partId)) acc.set(r.partId, r.totalReturnedQuantity);
    return acc;
  }, new Map<number, number>());
  const totalReturned = Array.from(uniquePartsReturns.values()).reduce((s, q) => s + q, 0);
  const totalLost = totalDefects - totalReturned;

  const defectsByMaterial = records.reduce((acc, r) => {
    if (r.materialName) acc[r.materialName] = (acc[r.materialName] || 0) + r.defectQuantity;
    return acc;
  }, {} as Record<string, number>);

  const defectsByMachine = records.reduce((acc, r) => {
    if (r.machineName) acc[r.machineName] = (acc[r.machineName] || 0) + r.defectQuantity;
    return acc;
  }, {} as Record<string, number>);

  const defectsByStage = records.reduce((acc, r) => {
    acc[r.stageName] = (acc[r.stageName] || 0) + r.defectQuantity;
    return acc;
  }, {} as Record<string, number>);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  const formatTime = (date: Date | string) =>
    new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className={styles.filtersSection}>
        <h4>🔍 Фильтры</h4>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Период с:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Период по:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Заказ:</label>
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value ? Number(e.target.value) : '')}
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
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value ? Number(e.target.value) : '')}
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
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value ? Number(e.target.value) : '')}
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
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value ? Number(e.target.value) : '')}
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
            onClick={applyFilters}
            disabled={loading}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            {loading ? '⏳ Загрузка...' : '🔍 Применить фильтры'}
          </button>
          <button
            onClick={resetFilters}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            🔄 Сбросить
          </button>
        </div>
      </div>

      {records.length > 0 && (
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
                <div className={styles.statLabel}>Невозвращенный брак</div>
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
            <h4>📋 Детальная информация ({records.length} записей)</h4>
            <div className={styles.tableWrapper}>
              <table className={styles.defectTable}>
                <thead>
                  <tr>
                    <th className={styles.thDate}>Дата</th>
                    <th className={styles.thOrder}>Заказ / Упаковка</th>
                    <th className={styles.thPart}>Деталь</th>
                    <th className={styles.thMaterial}>Материал</th>
                    <th className={styles.thQty}>Кол-во</th>
                    <th className={styles.thStage}>Этап / Станок</th>
                    <th className={styles.thWorker}>Обнаружил</th>
                    <th className={styles.thReturn}>Возврат</th>
                    <th className={styles.thNote}>Примечание</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
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

      {!loading && records.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <div className={styles.emptyText}>
            Выберите фильтры и нажмите «Применить фильтры» для анализа брака
          </div>
        </div>
      )}
    </>
  );
};

export default DefectAnalysis;

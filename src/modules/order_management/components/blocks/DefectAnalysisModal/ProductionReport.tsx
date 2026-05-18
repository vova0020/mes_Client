import React, { useState, useEffect } from 'react';
import styles from './ProductionReport.module.css';
import {
  getMachineProduction,
  MachineProductionRecord,
  getFilterOptions,
  MachineFilterOption,
} from '../../../../api/orderManagementApi/defectStatisticsApi';

interface ProductionReportProps {
  onClose: () => void;
}

const ProductionReport: React.FC<ProductionReportProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<MachineProductionRecord[]>([]);
  
  const [machines, setMachines] = useState<MachineFilterOption[]>([]);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const data = await getFilterOptions();
      setMachines(data.machines);
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
      if (selectedMachine) params.machineId = Number(selectedMachine);
      const data = await getMachineProduction(params);
      setRecords(data);
    } catch (error) {
      console.error('Ошибка загрузки данных о выпуске:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedMachine('');
    setSearchQuery('');
    setRecords([]);
  };

  const totalQty = records.reduce((sum, r) => sum + r.quantityProcessed, 0);
  const totalDuration = records.reduce((sum, r) => sum + r.durationSeconds, 0);

  const filteredRecords = records.filter((record) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      record.partCode?.toLowerCase().includes(query) ||
      record.partName?.toLowerCase().includes(query) ||
      record.materialName?.toLowerCase().includes(query) ||
      record.materialSku?.toLowerCase().includes(query) ||
      record.packages.some(pkg => 
        pkg.packageName?.toLowerCase().includes(query) ||
        pkg.packageCode?.toLowerCase().includes(query)
      )
    );
  });

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
            <label className={styles.filterLabel}>Рабочее место (станок):</label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value ? Number(e.target.value) : '')}
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
          <div className={styles.searchSection}>
            <div className={styles.searchGroup}>
              <label className={styles.searchLabel}>🔎 Поиск:</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по детали, материалу, упаковке..."
                className={styles.searchInput}
              />
            </div>
          </div>
          <div className={styles.statisticsSection}>
            <h4>📈 Общая статистика выпуска</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{filteredRecords.length}</div>
                <div className={styles.statLabel}>Операций {searchQuery ? 'найдено' : 'выполнено'}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{totalQty}</div>
                <div className={styles.statLabel}>Деталей обработано</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{formatDuration(totalDuration)}</div>
                <div className={styles.statLabel}>Суммарное время работы</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {records.length > 0 ? Math.round(totalQty / records.length) : 0}
                </div>
                <div className={styles.statLabel}>Среднее кол-во за операцию</div>
              </div>
            </div>
          </div>

          <div className={styles.detailsSection}>
            <h4>📋 Журнал операций ({filteredRecords.length} записей)</h4>
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
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
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
                        </div>
                      </td>
                      <td className={styles.tdProdDuration}>
                        <span className={styles.durationBadge}>
                          {formatDuration(record.durationSeconds)}
                        </span>
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
          <div className={styles.emptyIcon}>🏭</div>
          <div className={styles.emptyText}>
            Выберите период и рабочее место, затем нажмите «Применить фильтры»
          </div>
        </div>
      )}
    </>
  );
};

export default ProductionReport;

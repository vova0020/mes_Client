import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './ProductionReport.module.css';
import ProductionTableRow from './ProductionTableRow';
import {
  getMachineProduction,
  MachineProductionRecord,
  getFilterOptions,
  MachineFilterOption,
  StageFilterOption,
  OrderFilterOption,
} from '../../../../api/orderManagementApi/defectStatisticsApi';

interface ProductionReportProps {
  onClose: () => void;
}

const ProductionReport: React.FC<ProductionReportProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<MachineProductionRecord[]>([]);
  
  const [machines, setMachines] = useState<MachineFilterOption[]>([]);
  const [stages, setStages] = useState<StageFilterOption[]>([]);
  const [orders, setOrders] = useState<OrderFilterOption[]>([]);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<number | ''>('');
  const [selectedStage, setSelectedStage] = useState<number | ''>('');
  const [selectedOrder, setSelectedOrder] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const data = await getFilterOptions();
      setMachines(data.machines);
      setStages(data.stages);
      setOrders(data.orders);
    } catch (error) {
      console.error('Ошибка загрузки опций фильтров:', error);
    }
  }, []);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const applyFilters = useCallback(async () => {
    setLoading(true);
    setRecords([]);
    try {
      const params: any = {};
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      if (selectedMachine) params.machineId = Number(selectedMachine);
      if (selectedStage) params.stageId = Number(selectedStage);
      if (selectedOrder) params.orderId = Number(selectedOrder);
      const data = await getMachineProduction(params);
      setRecords(data);
    } catch (error) {
      console.error('Ошибка загрузки данных о выпуске:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedMachine, selectedStage, selectedOrder]);

  const resetFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setSelectedMachine('');
    setSelectedStage('');
    setSelectedOrder('');
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setRecords([]);
  }, []);

  // Мемоизация статистики
  const statistics = useMemo(() => {
    const totalQty = records.reduce((sum, r) => sum + r.quantityProcessed, 0);
    const totalDuration = records.reduce((sum, r) => sum + r.durationSeconds, 0);
    return { totalQty, totalDuration };
  }, [records]);

  // Мемоизация фильтрации с debounced query
  const filteredRecords = useMemo(() => {
    if (!debouncedSearchQuery) return records;
    
    const query = debouncedSearchQuery.toLowerCase();
    return records.filter((record) =>
      record.partCode?.toLowerCase().includes(query) ||
      record.partName?.toLowerCase().includes(query) ||
      record.materialName?.toLowerCase().includes(query) ||
      record.materialSku?.toLowerCase().includes(query) ||
      record.packages.some(pkg =>
        pkg.packageName?.toLowerCase().includes(query) ||
        pkg.packageCode?.toLowerCase().includes(query)
      )
    );
  }, [records, debouncedSearchQuery]);

  const formatDate = useCallback((date: Date | string) =>
    new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }), []);

  const formatTime = useCallback((date: Date | string) =>
    new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), []);

  const formatDuration = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}ч ${m}м`;
    return `${m}м`;
  }, []);

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
                <div className={styles.statLabel}>Операций {debouncedSearchQuery ? 'найдено' : 'выполнено'}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{statistics.totalQty}</div>
                <div className={styles.statLabel}>Деталей обработано</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{formatDuration(statistics.totalDuration)}</div>
                <div className={styles.statLabel}>Суммарное время работы</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {records.length > 0 ? Math.round(statistics.totalQty / records.length) : 0}
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
                    <ProductionTableRow
                      key={record.operationId}
                      record={record}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      formatDuration={formatDuration}
                    />
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

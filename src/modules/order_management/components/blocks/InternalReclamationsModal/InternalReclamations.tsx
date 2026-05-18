import React, { useState, useMemo, useCallback, useEffect } from 'react';
import styles from './InternalReclamations.module.css';
import ReclamationTableRow from './ReclamationTableRow';
import SearchableSelect from './SearchableSelect';
import { exportToExcel } from './excelExport';
import {
  UnreturnedDefectRecord,
  getUnreturnedDefects,
  getFilterOptions,
  OrderFilterOption,
  PackageFilterOption,
} from '../../../../api/orderManagementApi/unreturnedDefectsApi';

interface InternalReclamationsProps {
  onClose: () => void;
}

const InternalReclamations: React.FC<InternalReclamationsProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<UnreturnedDefectRecord[]>([]);
  
  const [orders, setOrders] = useState<OrderFilterOption[]>([]);
  const [packages, setPackages] = useState<PackageFilterOption[]>([]);
  
  const [selectedOrder, setSelectedOrder] = useState<number | ''>('');
  const [selectedPackage, setSelectedPackage] = useState<number | ''>('');

  // Загрузка опций фильтров при монтировании
  const loadFilterOptions = useCallback(async () => {
    try {
      const data = await getFilterOptions();
      setOrders(data.orders);
      setPackages(data.packages);
    } catch (error) {
      console.error('Ошибка загрузки опций фильтров:', error);
    }
  }, []);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Применение фильтров и загрузка данных
  const applyFilters = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedOrder) params.orderId = Number(selectedOrder);
      if (selectedPackage) params.packageId = Number(selectedPackage);
      
      const data = await getUnreturnedDefects(params);
      setRecords(data);
    } catch (error) {
      console.error('Ошибка загрузки данных о невозвращенных деталях:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedOrder, selectedPackage]);

  // Сброс фильтров
  const resetFilters = useCallback(() => {
    setSelectedOrder('');
    setSelectedPackage('');
    setRecords([]);
  }, []);

  // Фильтрация упаковок по выбранному заказу
  const filteredPackages = useMemo(() => {
    if (!selectedOrder) return packages;
    return packages.filter(pkg => pkg.orderId === Number(selectedOrder));
  }, [packages, selectedOrder]);

  // Статистика
  const statistics = useMemo(() => {
    const totalUnreturned = records.reduce((sum, r) => sum + r.unreturnedQuantity, 0);
    
    return {
      totalUnreturned
    };
  }, [records]);

  // Преобразование данных для SearchableSelect
  const orderOptions = useMemo(() => 
    orders.map(order => ({
      value: order.orderId,
      label: order.batchNumber,
      subLabel: order.orderName,
    })),
    [orders]
  );

  const packageOptions = useMemo(() => 
    filteredPackages.map(pkg => ({
      value: pkg.packageId,
      label: pkg.packageCode,
      subLabel: pkg.packageName,
    })),
    [filteredPackages]
  );

  const formatDate = useCallback((date: Date | string) =>
    new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }), []);

  const formatTime = useCallback((date: Date | string) =>
    new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), []);

  return (
    <>
      <div className={styles.filtersSection}>
        <h4>🔍 Фильтры</h4>
        <div className={styles.filtersGrid}>
          <SearchableSelect
            label="Заказ:"
            options={orderOptions}
            value={selectedOrder}
            onChange={(value) => {
              setSelectedOrder(value as number | '');
              // Сбросить выбранную упаковку при смене заказа
              if (selectedPackage) {
                const pkg = packages.find(p => p.packageId === Number(selectedPackage));
                if (pkg && pkg.orderId !== Number(value)) {
                  setSelectedPackage('');
                }
              }
            }}
            placeholder="Все заказы"
            emptyText="Нет доступных заказов"
          />
          <SearchableSelect
            label="Упаковка:"
            options={packageOptions}
            value={selectedPackage}
            onChange={(value) => setSelectedPackage(value as number | '')}
            placeholder="Все упаковки"
            emptyText={selectedOrder ? "Нет упаковок для выбранного заказа" : "Сначала выберите заказ или оставьте пустым"}
          />
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
            🔄 Сбросить фильтры
          </button>
          {records.length > 0 && (
            <button
              onClick={() => exportToExcel(records)}
              className={`${styles.button} ${styles.buttonSuccess}`}
            >
              📥 Выгрузить в Excel
            </button>
          )}
        </div>
      </div>

      {records.length > 0 && (
        <>
          <div className={styles.statisticsSection}>
            <h4>📈 Статистика</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{records.length}</div>
                <div className={styles.statLabel}>Всего записей</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{statistics.totalUnreturned}</div>
                <div className={styles.statLabel}>Невозвращенных деталей</div>
              </div>
            </div>
          </div>

          <div className={styles.detailsSection}>
            <h4>📋 Детальная информация ({records.length} записей)</h4>
            <div className={styles.tableWrapper}>
              <table className={styles.reclamationTable}>
                <thead>
                  <tr>
                    <th className={styles.thDate}>Дата</th>
                    <th className={styles.thOrder}>Заказ</th>
                    <th className={styles.thPackage}>Упаковка</th>
                    <th className={styles.thPart}>Деталь</th>
                    <th className={styles.thSize}>Размер детали</th>
                    <th className={styles.thMaterial}>Материал</th>
                    <th className={styles.thQty}>Кол-во</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <ReclamationTableRow
                      key={record.reclamationId}
                      record={record}
                      formatDate={formatDate}
                      formatTime={formatTime}
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
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyText}>
            Выберите фильтры и нажмите «Применить фильтры» для просмотра невозвращенных деталей
          </div>
        </div>
      )}
    </>
  );
};

export default InternalReclamations;

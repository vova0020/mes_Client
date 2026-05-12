import React, { useState, useEffect } from 'react';
import styles from './DefectAnalysisModal.module.css';
import {
  DefectDetail,
  getDefectStatistics,
  getOrdersForFilter,
  getMaterialsForFilter,
  getWorkersForFilter,
  getStagesForFilter,
  getColorsForFilter,
  OrderFilterOption,
  MaterialFilterOption,
  FilterOption,
} from '../../../api/orderManagementApi/defectStatisticsApi';

interface DefectAnalysisModalProps {
  onClose: () => void;
}

const DefectAnalysisModal: React.FC<DefectAnalysisModalProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [defectRecords, setDefectRecords] = useState<DefectDetail[]>([]);
  
  // Состояния фильтров
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<number | ''>('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<number | ''>('');
  const [selectedStage, setSelectedStage] = useState<number | ''>('');
  const [selectedOrder, setSelectedOrder] = useState<number | ''>('');
  
  // Списки для фильтров
  const [materials, setMaterials] = useState<MaterialFilterOption[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [workers, setWorkers] = useState<FilterOption[]>([]);
  const [stages, setStages] = useState<FilterOption[]>([]);
  const [orders, setOrders] = useState<OrderFilterOption[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    loadFilterOptions();
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  };

  // Загрузка опций для фильтров
  const loadFilterOptions = async () => {
    try {
      const [materialsData, colorsData, workersData, stagesData, ordersData] = await Promise.all([
        getMaterialsForFilter(),
        getColorsForFilter(),
        getWorkersForFilter(),
        getStagesForFilter(),
        getOrdersForFilter(),
      ]);

      setMaterials(materialsData);
      setColors(colorsData);
      setWorkers(workersData);
      setStages(stagesData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Ошибка загрузки опций фильтров:', error);
    }
  };

  // Применение фильтров и загрузка данных
  const applyFilters = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      if (selectedMaterial) params.materialId = Number(selectedMaterial);
      if (selectedColor) params.color = selectedColor;
      if (selectedWorker) params.workerId = Number(selectedWorker);
      if (selectedStage) params.stageId = Number(selectedStage);
      if (selectedOrder) params.orderId = Number(selectedOrder);

      const data = await getDefectStatistics(params);
      setDefectRecords(data);
    } catch (error) {
      console.error('Ошибка загрузки данных о браке:', error);
      // Можно добавить уведомление об ошибке
    } finally {
      setLoading(false);
    }
  };

  // Сброс фильтров
  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedMaterial('');
    setSelectedColor('');
    setSelectedWorker('');
    setSelectedStage('');
    setSelectedOrder('');
    setDefectRecords([]);
  };

  // Подсчет статистики с учетом уникальных деталей
  const totalDefects = defectRecords.reduce((sum, record) => sum + record.defectQuantity, 0);
  
  // Для подсчета возвратов нужно учитывать уникальные детали
  // так как одна деталь может быть в нескольких рекламациях
  const uniquePartsReturns = defectRecords.reduce((acc, record) => {
    if (!acc.has(record.partId)) {
      acc.set(record.partId, record.totalReturnedQuantity);
    }
    return acc;
  }, new Map<number, number>());
  
  const totalReturned = Array.from(uniquePartsReturns.values()).reduce((sum, qty) => sum + qty, 0);
  const totalLost = totalDefects - totalReturned;

  // Группировка по материалам
  const defectsByMaterial = defectRecords.reduce((acc, record) => {
    if (record.materialName) {
      const key = record.materialName;
      acc[key] = (acc[key] || 0) + record.defectQuantity;
    }
    return acc;
  }, {} as Record<string, number>);

  // Группировка по работникам
  const defectsByWorker = defectRecords.reduce((acc, record) => {
    if (record.reportedByName) {
      acc[record.reportedByName] = (acc[record.reportedByName] || 0) + record.defectQuantity;
    }
    return acc;
  }, {} as Record<string, number>);

  // Группировка по этапам
  const defectsByStage = defectRecords.reduce((acc, record) => {
    acc[record.stageName] = (acc[record.stageName] || 0) + record.defectQuantity;
    return acc;
  }, {} as Record<string, number>);

  // Форматирование даты
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Форматирование даты и времени
  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Получение статуса на русском
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      NEW: 'Новая',
      CONFIRMED: 'Подтверждена',
      RESOLVED: 'Решена',
    };
    return statusMap[status] || status;
  };

  // Получение действия по качеству на русском
  const getQualityActionText = (action: string | null) => {
    if (!action) return '-';
    const actionMap: Record<string, string> = {
      RETURN_TO_PRODUCTION: 'Возврат в производство',
      SCRAP: 'Списание',
      REWORK: 'Переработка',
    };
    return actionMap[action] || action;
  };

  return (
    <div className={`${styles.modalOverlay} ${isVisible ? styles.visible : ''}`} onClick={handleClose}>
      <div className={`${styles.modalContent} ${isVisible ? styles.slideIn : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>📊 Анализ брака по итогам периода</h3>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {/* Секция фильтров */}
          <div className={styles.filtersSection}>
            <h4>🔍 Фильтры</h4>
            
            <div className={styles.filtersGrid}>
              {/* Период */}
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

              {/* Заказ */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Заказ:</label>
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value ? Number(e.target.value) : '')}
                  className={styles.filterSelect}
                >
                  <option value="">Все заказы</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.batchNumber} - {order.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Материал */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Материал:</label>
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value ? Number(e.target.value) : '')}
                  className={styles.filterSelect}
                >
                  <option value="">Все материалы</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Цвет */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Цвет:</label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">Все цвета</option>
                  {colors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              {/* Рабочее место */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Рабочее место:</label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value ? Number(e.target.value) : '')}
                  className={styles.filterSelect}
                >
                  <option value="">Все рабочие места</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Этап */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Этап производства:</label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value ? Number(e.target.value) : '')}
                  className={styles.filterSelect}
                >
                  <option value="">Все этапы</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
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

          {/* Секция статистики */}
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

              {/* Брак по материалам */}
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

              {/* Брак по работникам */}
              {Object.keys(defectsByWorker).length > 0 && (
                <div className={styles.analysisSection}>
                  <h4>👷 Брак по рабочим местам</h4>
                  <div className={styles.analysisGrid}>
                    {Object.entries(defectsByWorker)
                      .sort(([, a], [, b]) => b - a)
                      .map(([worker, count]) => (
                        <div key={worker} className={styles.analysisCard}>
                          <div className={styles.analysisLabel}>{worker}</div>
                          <div className={styles.analysisValue}>{count} шт.</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Брак по этапам */}
              {Object.keys(defectsByStage).length > 0 && (
                <div className={styles.analysisSection}>
                  <h4>⚙️ Брак по этапам производства</h4>
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

              {/* Детальная таблица */}
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
                        {/* <th className={styles.thStatus}>Статус</th> */}
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
                                {new Date(record.detectedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
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
                            ) : (
                              '-'
                            )}
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
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className={styles.tdQty}>
                            <div className={styles.qtyCell}>
                              <span className={styles.defectBadge}>{record.defectQuantity}</span>
                            </div>
                          </td>
                          <td className={styles.tdDefects}>
                            <div className={styles.defectTypes}>
                              {record.defectTypes.map((type, idx) => (
                                <span key={idx} className={styles.defectType}>
                                  {type}
                                </span>
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
                          <td className={styles.tdWorker}>
                            {record.reportedByName || '-'}
                          </td>
                          {/* <td className={styles.tdStatus}>
                            <span className={`${styles.statusBadge} ${styles[`status${record.status}`]}`}>
                              {getStatusText(record.status)}
                            </span>
                          </td> */}
                          <td className={styles.tdReturn}>
                            {record.returnEvents.length > 0 ? (
                              <div className={styles.returnCell}>
                                <div className={styles.returnHeader}>
                                  <span className={styles.returnBadge}>
                                    ✓ Возвращено: {record.totalReturnedQuantity} шт.
                                  </span>
                                  {record.returnEvents.length > 1 && (
                                    <span className={styles.returnCount}>
                                      {record.returnEvents.length} {record.returnEvents.length === 1 ? 'возврат' : record.returnEvents.length < 5 ? 'возврата' : 'возвратов'}
                                    </span>
                                  )}
                                </div>
                                <div className={styles.returnEventsList}>
                                  {record.returnEvents.map((event, idx) => (
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
                                          {event.returnToMachineName && (
                                            <span>⚙️ {event.returnToMachineName}</span>
                                          )}
                                          {event.returnPalletName && (
                                            <span>📦 {event.returnPalletName}</span>
                                          )}
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
                            <div className={styles.noteCell}>
                              {record.note || '—'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Сообщение когда нет данных */}
          {!loading && defectRecords.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📊</div>
              <div className={styles.emptyText}>
                Выберите фильтры и нажмите "Применить фильтры" для анализа брака
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefectAnalysisModal;

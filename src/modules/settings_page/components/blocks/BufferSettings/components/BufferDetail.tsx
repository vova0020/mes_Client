import React, { useState } from 'react';
import { BufferResponse, CellStatus, BufferCellResponse, UpdateBufferCellDto } from '../types/buffers.types';
import { 
  useBuffer, 
  useBufferCells, 
  useBufferCellsStatistics,
  useUpdateBufferCell,
  useDeleteBufferCell,
  useCreateBufferCell
} from '../hooks/useBuffersQuery';
import styles from './BufferDetail.module.css';

interface BufferDetailProps {
  selectedBuffer?: BufferResponse | null;
  onBufferUpdated?: (buffer: BufferResponse) => void;
}

interface EditCellForm {
  cellCode: string;
  capacity: number;
  currentLoad: number;
  status: CellStatus;
}

const BufferDetail: React.FC<BufferDetailProps> = ({
  selectedBuffer,
  onBufferUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'cells' | 'stages'>('info');
  const [newCellForm, setNewCellForm] = useState({
    cellCode: '',
    capacity: 0,
    currentLoad: 0,
    status: CellStatus.AVAILABLE
  });
  const [showNewCellForm, setShowNewCellForm] = useState(false);
  
  // Состояние для редактирования ячейки
  const [editingCell, setEditingCell] = useState<BufferCellResponse | null>(null);
  const [editCellForm, setEditCellForm] = useState<EditCellForm>({
    cellCode: '',
    capacity: 0,
    currentLoad: 0,
    status: CellStatus.AVAILABLE
  });
  const [editCellErrors, setEditCellErrors] = useState<Record<string, string>>({});

  // Исправленные строки - убрал вторые параметры с опциями
  const { data: bufferDetail } = useBuffer(selectedBuffer?.bufferId!);
  const { data: cells } = useBufferCells(selectedBuffer?.bufferId!);
  const { data: cellsStats } = useBufferCellsStatistics(selectedBuffer?.bufferId!);
  
  const updateCellMutation = useUpdateBufferCell();
  const deleteCellMutation = useDeleteBufferCell();
  const createCellMutation = useCreateBufferCell();

  if (!selectedBuffer) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>📦</div>
        <div className={styles.emptyStateTitle}>Выберите буфер</div>
        <div className={styles.emptyStateDescription}>
          Выберите буфер из списка слева для просмотра подробной информации
        </div>
      </div>
    );
  }

  const handleCellStatusChange = async (cellId: number, status: CellStatus) => {
    try {
      await updateCellMutation.mutateAsync({
        cellId,
        bufferId: selectedBuffer.bufferId,
        data: { status }
      });
    } catch (error) {
      console.error('Ошибка при обновлении статуса ячейки:', error);
    }
  };

  const handleDeleteCell = async (cellId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту ячейку?')) {
      try {
        await deleteCellMutation.mutateAsync({
          cellId,
          bufferId: selectedBuffer.bufferId
        });
      } catch (error) {
        console.error('Ошибка при удалении ячейки:', error);
      }
    }
  };

  const handleCreateCell = async () => {
    if (!newCellForm.cellCode.trim()) {
      alert('Введите код ячейки');
      return;
    }

    if (newCellForm.capacity <= 0) {
      alert('Вместимость должна быть больше 0');
      return;
    }

    if (newCellForm.currentLoad < 0 || newCellForm.currentLoad > newCellForm.capacity) {
      alert('Текущая загрузка не может быть отрицательной или превышать вместимость');
      return;
    }

    try {
      await createCellMutation.mutateAsync({
        bufferId: selectedBuffer.bufferId,
        data: newCellForm
      });
      setNewCellForm({
        cellCode: '',
        capacity: 0,
        currentLoad: 0,
        status: CellStatus.AVAILABLE
      });
      setShowNewCellForm(false);
    } catch (error) {
      console.error('Ошибка при создании ячейки:', error);
      alert('Ошибка при создании ячейки');
    }
  };

  // Функции для редактирования ячейки
  const handleEditCell = (cell: BufferCellResponse) => {
    setEditingCell(cell);
    setEditCellForm({
      cellCode: cell.cellCode,
      capacity: cell.capacity,
      currentLoad: cell.currentLoad,
      status: cell.status
    });
    setEditCellErrors({});
  };

  const validateEditCellForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editCellForm.cellCode.trim()) {
      errors.cellCode = 'Код ячейки обязателен';
    } else if (editCellForm.cellCode.length > 20) {
      errors.cellCode = 'Код ячейки не должен превышать 20 символов';
    }

    if (editCellForm.capacity <= 0) {
      errors.capacity = 'Вместимость должна быть больше 0';
    }

    if (editCellForm.currentLoad < 0) {
      errors.currentLoad = 'Текущая загрузка не может быть отрицательной';
    }

    if (editCellForm.currentLoad > editCellForm.capacity) {
      errors.currentLoad = 'Текущая загрузка не может превышать вместимость';
    }

    setEditCellErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateCell = async () => {
    if (!validateEditCellForm() || !editingCell) return;

    try {
      const updateData: UpdateBufferCellDto = {};
      
      // Добавляем только измененные поля
      if (editCellForm.cellCode !== editingCell.cellCode) {
        updateData.cellCode = editCellForm.cellCode;
      }
      if (editCellForm.capacity !== editingCell.capacity) {
        updateData.capacity = editCellForm.capacity;
      }
      if (editCellForm.currentLoad !== editingCell.currentLoad) {
        updateData.currentLoad = editCellForm.currentLoad;
      }
      if (editCellForm.status !== editingCell.status) {
        updateData.status = editCellForm.status;
      }

      // Если нет изменений, закрываем форму
      if (Object.keys(updateData).length === 0) {
        setEditingCell(null);
        return;
      }

      await updateCellMutation.mutateAsync({
        cellId: editingCell.cellId,
        bufferId: selectedBuffer.bufferId,
        data: updateData
      });

      setEditingCell(null);
    } catch (error) {
      console.error('Ошибка при обновлении ячейки:', error);
      alert('Ошибка при обновлении ячейки');
    }
  };

  const handleCancelEditCell = () => {
    setEditingCell(null);
    setEditCellErrors({});
  };

  const getStatusColor = (status: CellStatus) => {
    switch (status) {
      case CellStatus.AVAILABLE:
        return '#10b981';
      case CellStatus.OCCUPIED:
        return '#f59e0b';
      case CellStatus.RESERVED:
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: CellStatus) => {
    switch (status) {
      case CellStatus.AVAILABLE:
        return 'Доступна';
      case CellStatus.OCCUPIED:
        return 'Занята';
      case CellStatus.RESERVED:
        return 'Зарезервирована';
      default:
        return status;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>{selectedBuffer.bufferName}</h3>
          <div className={styles.subtitle}>
            <span className={styles.location}>📍 {selectedBuffer.location}</span>
            {selectedBuffer.description && (
              <span className={styles.description}>{selectedBuffer.description}</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Информация
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'cells' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('cells')}
        >
          Ячейки ({selectedBuffer.cellsCount})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'stages' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('stages')}
        >
          Этапы ({selectedBuffer.stagesCount})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'info' && (
          <div className={styles.tabContent}>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <h4>Основная информация</h4>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>ID буфера:</span>
                    <span className={styles.infoValue}>{selectedBuffer.bufferId}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Название:</span>
                    <span className={styles.infoValue}>{selectedBuffer.bufferName}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Местоположение:</span>
                    <span className={styles.infoValue}>{selectedBuffer.location}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Количество ячеек:</span>
                    <span className={styles.infoValue}>{selectedBuffer.cellsCount}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Количество этапов:</span>
                    <span className={styles.infoValue}>{selectedBuffer.stagesCount}</span>
                  </div>
                  {selectedBuffer.description && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Описание:</span>
                      <span className={styles.infoValue}>{selectedBuffer.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {cellsStats && (
                <div className={styles.infoCard}>
                  <h4>Статистика ячеек</h4>
                  <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{cellsStats.totalCells}</span>
                      <span className={styles.statLabel}>Всего ячеек</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{cellsStats.availableCells}</span>
                      <span className={styles.statLabel}>Доступно</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{cellsStats.occupiedCells}</span>
                      <span className={styles.statLabel}>Занято</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{cellsStats.reservedCells}</span>
                      <span className={styles.statLabel}>Зарезервировано</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{cellsStats.totalCapacity}</span>
                      <span className={styles.statLabel}>Общая вместимость</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{cellsStats.utilizationPercentage.toFixed(1)}%</span>
                      <span className={styles.statLabel}>Загруженность</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cells' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h4>Ячейки буфера</h4>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => setShowNewCellForm(!showNewCellForm)}
              >
                {showNewCellForm ? 'Отмена' : '+ Добавить ячейку'}
              </button>
            </div>

            {showNewCellForm && (
              <div className={styles.cellForm}>
                <h5>Новая ячейка</h5>
                <div className={styles.cellFormGrid}>
                  <div className={styles.field}>
                    <label>Код ячейки</label>
                    <input
                      type="text"
                      placeholder="Введите код ячейки"
                      value={newCellForm.cellCode}
                      onChange={(e) => setNewCellForm(prev => ({ ...prev, cellCode: e.target.value }))}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Вместимость</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newCellForm.capacity}
                      onChange={(e) => setNewCellForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                      min="1"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Текущая загрузка</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newCellForm.currentLoad}
                      onChange={(e) => setNewCellForm(prev => ({ ...prev, currentLoad: Number(e.target.value) }))}
                      min="0"
                      max={newCellForm.capacity}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Статус</label>
                    <select
                      value={newCellForm.status}
                      onChange={(e) => setNewCellForm(prev => ({ ...prev, status: e.target.value as CellStatus }))}
                    >
                      <option value={CellStatus.AVAILABLE}>Доступна</option>
                      <option value={CellStatus.OCCUPIED}>Занята</option>
                      <option value={CellStatus.RESERVED}>Зарезервирована</option>
                    </select>
                  </div>
                </div>
                <div className={styles.cellFormActions}>
                  <button 
                    onClick={handleCreateCell} 
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    disabled={createCellMutation.isPending}
                  >
                    {createCellMutation.isPending ? 'Создание...' : 'Создать'}
                  </button>
                </div>
              </div>
            )}

            <div className={styles.cellsGrid}>
              {cells?.map((cell) => (
                <div key={cell.cellId} className={styles.cellCard}>
                  <div className={styles.cellHeader}>
                    <span className={styles.cellCode}>{cell.cellCode}</span>
                    <div
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(cell.status) }}
                    >
                      {getStatusText(cell.status)}
                    </div>
                  </div>
                  
                  <div className={styles.cellInfo}>
                    <div className={styles.cellInfoItem}>
                      <span>Вместимость:</span>
                      <span>{cell.capacity}</span>
                    </div>
                    <div className={styles.cellInfoItem}>
                      <span>Загрузка:</span>
                      <span>{cell.currentLoad}</span>
                    </div>
                    <div className={styles.cellInfoItem}>
                      <span>Загруженность:</span>
                      <span>{cell.capacity > 0 ? ((cell.currentLoad / cell.capacity) * 100).toFixed(1) : '0'}%</span>
                    </div>
                  </div>

                  <div className={styles.cellActions}>
                    <select
                      value={cell.status}
                      onChange={(e) => handleCellStatusChange(cell.cellId, e.target.value as CellStatus)}
                      className={styles.statusSelect}
                      disabled={updateCellMutation.isPending}
                    >
                      <option value={CellStatus.AVAILABLE}>Доступна</option>
                      <option value={CellStatus.OCCUPIED}>Занята</option>
                      <option value={CellStatus.RESERVED}>Зарезервирована</option>
                    </select>
                    
                    <button
                      className={styles.editButton}
                      onClick={() => handleEditCell(cell)}
                      disabled={updateCellMutation.isPending}
                      title="Редактировать ячейку"
                    >
                      ✏️
                    </button>
                    
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteCell(cell.cellId)}
                      disabled={deleteCellMutation.isPending}
                      title="Удалить ячейку"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {(!cells || cells.length === 0) && (
              <div className={styles.emptyCells}>
                <div className={styles.emptyIcon}>📦</div>
                <div className={styles.emptyTitle}>Нет ячеек</div>
                <div className={styles.emptyDescription}>
                  Добавьте первую ячейку для этого буфера
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stages' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h4>Связанные этапы</h4>
            </div>

            <div className={styles.stagesGrid}>
              {bufferDetail?.bufferStages?.map((bufferStage) => (
                <div key={bufferStage.bufferStageId} className={styles.stageCard}>
                  <div className={styles.stageContent}>
                    <h5 className={styles.stageName}>{bufferStage.stage.stageName}</h5>
                    {bufferStage.stage.description && (
                      <p className={styles.stageDescription}>{bufferStage.stage.description}</p>
                    )}
                  </div>
                  <div className={styles.stageId}>
                    ID: {bufferStage.stage.stageId}
                  </div>
                </div>
              ))}
            </div>

            {(!bufferDetail?.bufferStages || bufferDetail.bufferStages.length === 0) && (
              <div className={styles.emptyStages}>
                <div className={styles.emptyIcon}>🔄</div>
                <div className={styles.emptyTitle}>Нет связанных этапов</div>
                <div className={styles.emptyDescription}>
                  Этот буфер не связан ни с одним этапом производства
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно редактирования ячейки */}
      {editingCell && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4>Редактирование ячейки: {editingCell.cellCode}</h4>
              <button 
                className={styles.modalClose}
                onClick={handleCancelEditCell}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.editCellForm}>
                <div className={styles.field}>
                  <label>Код ячейки *</label>
                  <input
                    type="text"
                    value={editCellForm.cellCode}
                    onChange={(e) => setEditCellForm(prev => ({ ...prev, cellCode: e.target.value }))}
                    className={editCellErrors.cellCode ? styles.error : ''}
                    maxLength={20}
                    placeholder="Введите код ячейки"
                  />
                  {editCellErrors.cellCode && (
                    <span className={styles.errorText}>{editCellErrors.cellCode}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Вместимость *</label>
                  <input
                    type="number"
                    value={editCellForm.capacity}
                    onChange={(e) => setEditCellForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                    className={editCellErrors.capacity ? styles.error : ''}
                    min="1"
                    placeholder="Введите вместимость"
                  />
                  {editCellErrors.capacity && (
                    <span className={styles.errorText}>{editCellErrors.capacity}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Текущая загрузка *</label>
                  <input
                    type="number"
                    value={editCellForm.currentLoad}
                    onChange={(e) => setEditCellForm(prev => ({ ...prev, currentLoad: Number(e.target.value) }))}
                    className={editCellErrors.currentLoad ? styles.error : ''}
                    min="0"
                    max={editCellForm.capacity}
                    placeholder="Введите текущую загрузку"
                  />
                  {editCellErrors.currentLoad && (
                    <span className={styles.errorText}>{editCellErrors.currentLoad}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Статус</label>
                  <select
                    value={editCellForm.status}
                    onChange={(e) => setEditCellForm(prev => ({ ...prev, status: e.target.value as CellStatus }))}
                  >
                    <option value={CellStatus.AVAILABLE}>Доступна</option>
                    <option value={CellStatus.OCCUPIED}>Занята</option>
                    <option value={CellStatus.RESERVED}>Зарезервирована</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={handleCancelEditCell}
                disabled={updateCellMutation.isPending}
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleUpdateCell}
                disabled={updateCellMutation.isPending}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                {updateCellMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BufferDetail;
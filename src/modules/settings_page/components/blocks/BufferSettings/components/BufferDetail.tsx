import React, { useState } from 'react';
import { BufferResponse, CellStatus } from '../types/buffers.types';
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
  buffer: BufferResponse;
  onEdit: () => void;
  onBack: () => void;
}

const BufferDetail: React.FC<BufferDetailProps> = ({
  buffer,
  onEdit,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'cells' | 'stages'>('info');
  const [editingCell, setEditingCell] = useState<number | null>(null);
  const [newCellForm, setNewCellForm] = useState({
    cellCode: '',
    capacity: 0,
    currentLoad: 0,
    status: CellStatus.AVAILABLE
  });
  const [showNewCellForm, setShowNewCellForm] = useState(false);

  const { data: bufferDetail } = useBuffer(buffer.bufferId);
  const { data: cells } = useBufferCells(buffer.bufferId);
  const { data: cellsStats } = useBufferCellsStatistics(buffer.bufferId);
  
  const updateCellMutation = useUpdateBufferCell();
  const deleteCellMutation = useDeleteBufferCell();
  const createCellMutation = useCreateBufferCell();

  const handleCellStatusChange = async (cellId: number, status: CellStatus) => {
    try {
      await updateCellMutation.mutateAsync({
        cellId,
        bufferId: buffer.bufferId,
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
          bufferId: buffer.bufferId
        });
      } catch (error) {
        console.error('Ошибка при удалении ячейки:', error);
      }
    }
  };

  const handleCreateCell = async () => {
    try {
      await createCellMutation.mutateAsync({
        bufferId: buffer.bufferId,
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
    }
  };

  const getStatusColor = (status: CellStatus) => {
    switch (status) {
      case CellStatus.AVAILABLE:
        return '#4caf50';
      case CellStatus.OCCUPIED:
        return '#ff9800';
      case CellStatus.RESERVED:
        return '#f44336';
      default:
        return '#666';
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
        <div className={styles.headerInfo}>
          <h3>{buffer.bufferName}</h3>
          <p className={styles.location}>📍 {buffer.location}</p>
          {buffer.description && (
            <p className={styles.description}>{buffer.description}</p>
          )}
        </div>
        
        <button className={styles.editButton} onClick={onEdit}>
          Редактировать
        </button>
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
          Ячейки ({buffer.cellsCount})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'stages' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('stages')}
        >
          Этапы ({buffer.stagesCount})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'info' && (
          <div className={styles.infoTab}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <strong>ID буфера:</strong>
                <span>{buffer.bufferId}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Название:</strong>
                <span>{buffer.bufferName}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Местоположение:</strong>
                <span>{buffer.location}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Количество ячеек:</strong>
                <span>{buffer.cellsCount}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Количество этапов:</strong>
                <span>{buffer.stagesCount}</span>
              </div>
              {buffer.description && (
                <div className={styles.infoItem}>
                  <strong>Описание:</strong>
                  <span>{buffer.description}</span>
                </div>
              )}
            </div>

            {cellsStats && (
              <div className={styles.statsSection}>
                <h4>Статистика ячеек</h4>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{cellsStats.totalCells}</span>
                    <span className={styles.statLabel}>Всего ячеек</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{cellsStats.availableCells}</span>
                    <span className={styles.statLabel}>Доступно</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{cellsStats.occupiedCells}</span>
                    <span className={styles.statLabel}>Занято</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{cellsStats.reservedCells}</span>
                    <span className={styles.statLabel}>Зарезервировано</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{cellsStats.totalCapacity}</span>
                    <span className={styles.statLabel}>Общая вместимость</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{cellsStats.utilizationPercentage.toFixed(1)}%</span>
                    <span className={styles.statLabel}>Загруженность</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cells' && (
          <div className={styles.cellsTab}>
            <div className={styles.cellsHeader}>
              <h4>Ячейки буфера</h4>
              <button
                className={styles.addCellButton}
                onClick={() => setShowNewCellForm(!showNewCellForm)}
              >
                {showNewCellForm ? 'Отмена' : 'Добавить ячейку'}
              </button>
            </div>

            {showNewCellForm && (
              <div className={styles.newCellForm}>
                <div className={styles.cellFormRow}>
                  <input
                    type="text"
                    placeholder="Код ячейки"
                    value={newCellForm.cellCode}
                    onChange={(e) => setNewCellForm(prev => ({ ...prev, cellCode: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Вместимость"
                    value={newCellForm.capacity}
                    onChange={(e) => setNewCellForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    placeholder="Текущая загрузка"
                    value={newCellForm.currentLoad}
                    onChange={(e) => setNewCellForm(prev => ({ ...prev, currentLoad: Number(e.target.value) }))}
                  />
                  <select
                    value={newCellForm.status}
                    onChange={(e) => setNewCellForm(prev => ({ ...prev, status: e.target.value as CellStatus }))}
                  >
                    <option value={CellStatus.AVAILABLE}>Доступна</option>
                    <option value={CellStatus.OCCUPIED}>Занята</option>
                    <option value={CellStatus.RESERVED}>Зарезервирована</option>
                  </select>
                  <button onClick={handleCreateCell} className={styles.createCellButton}>
                    Создать
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
                      <span>{((cell.currentLoad / cell.capacity) * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className={styles.cellActions}>
                    <select
                      value={cell.status}
                      onChange={(e) => handleCellStatusChange(cell.cellId, e.target.value as CellStatus)}
                      className={styles.statusSelect}
                    >
                      <option value={CellStatus.AVAILABLE}>Доступна</option>
                      <option value={CellStatus.OCCUPIED}>Занята</option>
                      <option value={CellStatus.RESERVED}>Зарезервирована</option>
                    </select>
                    
                    <button
                      className={styles.deleteCellButton}
                      onClick={() => handleDeleteCell(cell.cellId)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stages' && (
          <div className={styles.stagesTab}>
            <h4>Связанные этапы</h4>
            <div className={styles.stagesList}>
              {bufferDetail?.bufferStages?.map((bufferStage) => (
                <div key={bufferStage.bufferStageId} className={styles.stageCard}>
                  <div className={styles.stageInfo}>
                    <h5>{bufferStage.stage.stageName}</h5>
                    {bufferStage.stage.description && (
                      <p>{bufferStage.stage.description}</p>
                    )}
                  </div>
                  <div className={styles.stageId}>
                    ID: {bufferStage.stage.stageId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BufferDetail;
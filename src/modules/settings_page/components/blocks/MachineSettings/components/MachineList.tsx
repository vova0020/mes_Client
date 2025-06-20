import React, { useState } from 'react';
import { useMachines, useDeleteMachine, useStagesStatistics } from '../hooks/useMachinesQuery';
import { Machine, MachineStatus } from '../MachineSettings';
import styles from './MachineList.module.css';

interface MachineListProps {
  onMachineSelect: (machine: Machine) => void;
  onMachineEdit: (machineId: number) => void;
  onMachineDeleted: (machineId: number) => void;
  selectedMachineId?: number;
}

export const MachineList: React.FC<MachineListProps> = ({
  onMachineSelect,
  onMachineEdit,
  onMachineDeleted,
  selectedMachineId,
}) => {
  const [filter, setFilter] = useState<{
    status?: MachineStatus;
    search?: string;
  }>({});

  const { data: machines = [], isLoading, error } = useMachines();
  const { data: statistics } = useStagesStatistics();
  const deleteMachineMutation = useDeleteMachine();

  // Фильтрация станков
  const filteredMachines = machines.filter(machine => {
    if (filter.status && machine.status !== filter.status) {
      return false;
    }
    if (filter.search && !machine.machineName.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleDeleteMachine = async (machineId: number, machineName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить станок "${machineName}"?`)) {
      try {
        await deleteMachineMutation.mutateAsync(machineId);
        onMachineDeleted(machineId);
      } catch (error) {
        console.error('Ошибка удаления станка:', error);
        alert('Ошибка удаления станка. Попробуйте еще раз.');
      }
    }
  };

  const getStatusBadge = (status: MachineStatus) => {
    const statusConfig = {
      [MachineStatus.ACTIVE]: { text: 'Активен', className: styles.statusActive },
      [MachineStatus.INACTIVE]: { text: 'Неактивен', className: styles.statusInactive },
      [MachineStatus.MAINTENANCE]: { text: 'Обслуживание', className: styles.statusMaintenance },
    };

    const config = statusConfig[status];
    return (
      <div className={`${styles.machineStatus} ${config.className}`}>
        <span className={styles.statusDot}></span>
        {config.text}
      </div>
    );
  };

  const getStagesCount = (machine: Machine) => {
    const stagesCount = machine.machinesStages?.length || 0;
    const substagesCount = machine.machineSubstages?.length || 0;
    return `${stagesCount} этапов, ${substagesCount} подэтапов`;
  };

  if (isLoading) {
    return (
      <div className={styles.machineListContainer}>
        <div className={styles.listHeader}>
          <h2 className={styles.formTitle}>Станки</h2>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Загрузка станков...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.machineListContainer}>
        <div className={styles.listHeader}>
          <h2 className={styles.formTitle}>Станки</h2>
        </div>
        <div className={styles.errorContainer}>
          <p>Ошибка загрузки: {error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className={styles.submitButton}
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.machineListContainer}>
      <div className={styles.listHeader}>
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={filter.search || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.resultsCount}>
          Найдено: {filteredMachines.length} из {machines.length}
        </div>
        
        {statistics && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏭</div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{statistics.machines}</div>
                <div className={styles.statLabel}>всего станков</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🔗</div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{statistics.machineStageConnections}</div>
                <div className={styles.statLabel}>связей этапов</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Фильтры */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Фильтр по статусу:</label>
          <select
            value={filter.status || ''}
            onChange={(e) => setFilter(prev => ({ 
              ...prev, 
              status: e.target.value as MachineStatus || undefined 
            }))}
            className={styles.filterSelect}
          >
            <option value="">Все статусы</option>
            <option value={MachineStatus.ACTIVE}>Активен</option>
            <option value={MachineStatus.INACTIVE}>Неактивен</option>
            <option value={MachineStatus.MAINTENANCE}>Обслуживание</option>
          </select>
        </div>
      </div>

      {/* Список станков */}
      <div className={styles.machinesList}>
        {filteredMachines.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🏭</div>
            <h3 className={styles.emptyStateTitle}>Станки не найдены</h3>
            <p className={styles.emptyStateDescription}>
              {filter.search || filter.status 
                ? 'Попробуйте изменить фильтры поиска'
                : 'Добавьте первый станок, нажав кнопку "Создать станок"'
              }
            </p>
          </div>
        ) : (
          filteredMachines.map((machine) => (
            <div
              key={machine.machineId}
              className={`${styles.machineCard} ${
                selectedMachineId === machine.machineId ? styles.machineSelected : ''
              }`}
              onClick={() => onMachineSelect(machine)}
            >
              <div className={styles.machineInfo}>
                <div className={styles.machineHeader}>
                  <h3 className={styles.machineName}>{machine.machineName}</h3>
                  {getStatusBadge(machine.status)}
                </div>

                <div className={styles.machineDetails}>
                  <div className={styles.loadInfo}>
                    <span className={styles.loadLabel}>Нагрузка:</span>
                    <div className={styles.loadValue}>
                      {machine.recommendedLoad}
                      <span className={styles.loadUnit}>{machine.loadUnit}</span>
                    </div>
                  </div>
                  
                  <div className={styles.stagesInfo}>
                    <span className={styles.stagesLabel}>Связи:</span>
                    <span className={styles.stagesCount}>
                      {getStagesCount(machine)}
                    </span>
                  </div>
                </div>

                {/* Краткий список этапов */}
                {machine.machinesStages && machine.machinesStages.length > 0 && (
                  <div className={styles.stagesPreview}>
                    <span className={styles.previewLabel}>Этапы:</span>
                    <div className={styles.stagesTags}>
                      {machine.machinesStages.slice(0, 3).map((machineStage) => (
                        <span key={machineStage.machineStageId} className={styles.stageTag}>
                          {machineStage.stage.stageName}
                        </span>
                      ))}
                      {machine.machinesStages.length > 3 && (
                        <span className={styles.stageTag}>
                          +{machine.machinesStages.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Особенности станка */}
                <div className={styles.machineFeatures}>
                  <span className={styles.featuresLabel}>Особенности:</span>
                  <div className={styles.featuresTags}>
                    <span className={`${styles.featureTag} ${machine.noSmenTask ? styles.taskChangeableTag : ''}`}>
                      {machine.noSmenTask ? 'Без сменного задания' : 'Со сменными заданиями'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.machineActions}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMachineEdit(machine.machineId);
                  }}
                  className={`${styles.actionButton} ${styles.editButton}`}
                  title="Редактировать"
                >
                  ✏ Изменить
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMachine(machine.machineId, machine.machineName);
                  }}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  title="Удалить"
                  disabled={deleteMachineMutation.isPending}
                >
                  {deleteMachineMutation.isPending ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
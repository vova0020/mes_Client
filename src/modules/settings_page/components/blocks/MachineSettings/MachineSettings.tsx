import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MachineList } from './components/MachineList';
import { MachineDetails } from './components/MachineDetails';
import { MachineForm } from './components/MachineForm';
import { useMachines } from './hooks/useMachinesQuery';
import styles from './MachineSettings.module.css';

// Создаем Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 минут
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Типы данных согласно API документации
export enum MachineStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE", 
  MAINTENANCE = "MAINTENANCE",
  BROKEN = "BROKEN"
}

export interface MachineStage {
  stageId: number;
  stageName: string;
  description?: string;
}

export interface MachineSubstage {
  substageId: number;
  substageName: string;
  description?: string;
  stage?: MachineStage;
}

export interface MachineStageResponse {
  machineStageId: number;
  machineId: number;
  stageId: number;
  stage: MachineStage;
}

export interface MachineSubstageResponse {
  machineSubstageId: number;
  machineId: number;
  substageId: number;
  substage: MachineSubstage;
}

export interface Machine {
  machineId: number;
  machineName: string;
  status: MachineStatus;
  recommendedLoad: number;
  loadUnit: string;
  noSmenTask: boolean;
  machinesStages?: MachineStageResponse[];
  machineSubstages?: MachineSubstageResponse[];
}

export interface CreateMachineDto {
  machineName: string;
  status: MachineStatus;
  recommendedLoad: number;
  loadUnit: string;
  noSmenTask: boolean;
}

export interface UpdateMachineDto {
  machineName?: string;
  status?: MachineStatus;
  recommendedLoad?: number;
  loadUnit?: string;
  noSmenTask?: boolean;
}

export interface StageWithSubstages {
  stageId: number;
  stageName: string;
  description?: string;
  substages: MachineSubstage[];
}

const MachineSettingsContent: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [editMachineId, setEditMachineId] = useState<number>();
  const [showForm, setShowForm] = useState(false);

  // Получаем данные станков
  const { data: machines = [] } = useMachines();
  


  // Обновляем selectedMachine при изменении списка станков
  useEffect(() => {
    if (selectedMachine && machines.length > 0) {
      const updatedMachine = machines.find(m => m.machineId === selectedMachine.machineId);
      if (updatedMachine) {
        console.log('[MachineSettings] Обновляем selectedMachine:', updatedMachine);
        setSelectedMachine(updatedMachine);
      } else {
        // Если станок был удален, сбрасываем выбор
        console.log('[MachineSettings] Станок был удален, сбрасываем выбор');
        setSelectedMachine(null);
      }
    }
  }, [machines, selectedMachine?.machineId]);

  const handleMachineSelect = (machine: Machine) => {
    console.log('[MachineSettings] Выбран станок:', machine);
    setSelectedMachine(machine);
  };

  const handleMachineEdit = (machineId: number) => {
    setEditMachineId(machineId);
    setShowForm(true);
  };

  const handleCreateMachine = () => {
    setEditMachineId(undefined);
    setShowForm(true);
  };

  const handleMachineSaved = () => {
    setEditMachineId(undefined);
    setShowForm(false);
    // Данные автоматически обновятся благодаря React Query и Socket.IO
  };

  const handleCancelEdit = () => {
    setEditMachineId(undefined);
    setShowForm(false);
  };

  const handleMachineDeleted = (deletedMachineId: number) => {
    // Если удаленный станок был выбран, сбрасываем выбор
    if (selectedMachine?.machineId === deletedMachineId) {
      setSelectedMachine(null);
    }
  };

  // Callback для обновления выбранного станка после изменений
  const handleMachineUpdated = (updatedMachine: Machine) => {
    console.log('[MachineSettings] Получено обновление станка:', updatedMachine);
    if (selectedMachine?.machineId === updatedMachine.machineId) {
      setSelectedMachine(updatedMachine);
    }
  };

  return (
    <div className={styles.pageContainer}>


      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <h1 className={styles.pageTitle}>
            <span className={styles.pageTitleIcon}>🏭</span>
            Управление станками
          </h1>
          <p className={styles.pageSubtitle}>
            Настройка станков, их статусов и связей с этапами производства

          </p>
        </div>
        <div className={styles.pageHeaderActions}>
          <button
            onClick={handleCreateMachine}
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonLarge}`}
          >
            <span className={styles.buttonIcon}>+</span>
            Создать станок
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentPanel}>
          <div className={styles.machinesLayout}>
            {/* Left Panel - Machines List */}
            <div className={styles.leftPanel}>
              <MachineList 
                onMachineSelect={handleMachineSelect}
                onMachineEdit={handleMachineEdit}
                onMachineDeleted={handleMachineDeleted}
                selectedMachineId={selectedMachine?.machineId}
              />
            </div>

            {/* Right Panel - Machine Details */}
            <div className={styles.rightPanel}>
              <MachineDetails 
                selectedMachine={selectedMachine}
                onMachineUpdated={handleMachineUpdated}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Machine Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={handleCancelEdit}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <MachineForm 
              editId={editMachineId} 
              onSaved={handleMachineSaved}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const MachineSettings: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MachineSettingsContent />
    </QueryClientProvider>
  );
};

export default MachineSettings;
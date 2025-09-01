import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, Select, FormControl, InputLabel, Button, Box } from '@mui/material';
import { fetchMachinesBySegment, Machine } from '../../../api/ypakMasterApi/machineMasterService';
import { machineApi, MachineStatus } from '../../../api/machineApi/machineApi';
import styles from './YpakMachineStatusMenu.module.css';

interface YpakMachineStatusMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

const statusLabels: Record<MachineStatus, string> = {
  ACTIVE: 'Активен',
  INACTIVE: 'Неактивен', 
  MAINTENANCE: 'Обслуживание',
  BROKEN: 'Сломан'
};

const YpakMachineStatusMenu: React.FC<YpakMachineStatusMenuProps> = ({ anchorEl, open, onClose }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<MachineStatus | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadMachines();
    }
  }, [open]);

  const loadMachines = async () => {
    try {
      const machineList = await fetchMachinesBySegment();
      console.log('Загруженные станки упаковки:', machineList);
      setMachines(machineList);
    } catch (error) {
      console.error('Ошибка загрузки станков упаковки:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMachine || !selectedStatus) return;

    setLoading(true);
    try {
      await machineApi.changeMachineStatus(selectedMachine as number, selectedStatus as MachineStatus);
      setSelectedMachine('');
      setSelectedStatus('');
      onClose();
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      className={styles.menu}
      PaperProps={{
        elevation: 0,
        sx: {
          background: 'transparent',
          boxShadow: 'none'
        }
      }}
    >
      <Box className={styles.menuContent}>
        <div className={styles.title}>
          Управление станками упаковки
        </div>
        
        <FormControl fullWidth margin="dense" className={styles.formControl}>
          <InputLabel>Выберите станок</InputLabel>
          <Select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value as number | '')}
            label="Выберите станок"
          >
            {machines.sort((a, b) => a.id - b.id).map((machine) => (
              <MenuItem key={machine.id} value={machine.id}>
                {machine.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense" className={styles.formControl}>
          <InputLabel>Новый статус</InputLabel>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as MachineStatus)}
            label="Новый статус"
          >
            {Object.entries(statusLabels).map(([status, label]) => (
              <MenuItem key={status} value={status}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box className={styles.buttons}>
          <Button 
            onClick={onClose} 
            variant="outlined" 
            size="medium"
            className={styles.cancelButton}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            size="medium"
            disabled={!selectedMachine || !selectedStatus || loading}
            className={styles.submitButton}
          >
            {loading ? 'Сохранение...' : 'Применить'}
          </Button>
        </Box>
      </Box>
    </Menu>
  );
};

export default YpakMachineStatusMenu;
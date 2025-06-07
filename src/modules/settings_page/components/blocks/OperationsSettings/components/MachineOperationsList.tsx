import React, { useState } from 'react';
import {
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    TextField,
    InputAdornment,
    Divider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { IMachineProcessStep, IProcessStep, IMachine } from '../OperationsSettings';
import styles from './MachineOperationsList.module.css';

interface MachineOperationsListProps {
    machineSteps: IMachineProcessStep[];
    machines: IMachine[];
    operations: IProcessStep[];
}

const MachineOperationsList: React.FC<MachineOperationsListProps> = ({
    machineSteps,
    machines,
    operations
}) => {
    // Состояние для поиска
    const [searchTerm, setSearchTerm] = useState('');

    // Функция для получения названия операции по ID
    const getOperationName = (operationId: number): string => {
        const operation = operations.find(op => op.id === operationId);
        return operation ? operation.name : 'Неизвестная операция';
    };

    // Функция для получения названия станка по ID
    const getMachineName = (machineId: number): string => {
        const machine = machines.find(m => m.id === machineId);
        return machine ? machine.name : 'Неизвестный станок';
    };

    // Фильтрация шагов по поисковому запросу
    const filteredSteps = machineSteps.filter(step => {
        const machineName = getMachineName(step.machineId).toLowerCase();
        const operationName = getOperationName(step.processStepId).toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return machineName.includes(searchLower) || operationName.includes(searchLower);
    });

    // Группировка шагов по станкам для удобного отображения
    const groupedByMachine: Record<number, IMachineProcessStep[]> = {};
    filteredSteps.forEach(step => {
        if (!groupedByMachine[step.machineId]) {
            groupedByMachine[step.machineId] = [];
        }
        groupedByMachine[step.machineId].push(step);
    });

    return (
        <div>
            <Typography variant="h6" style={{ marginBottom: '16px' }}>
                Связи операций со станками
            </Typography>

            <TextField
                fullWidth
                variant="outlined"
                placeholder="Поиск по названию станка или операции"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
                style={{ marginBottom: '16px' }}
            />
            
            <Divider style={{ marginBottom: '16px' }} />
            
            {Object.keys(groupedByMachine).length === 0 ? (
                <Typography className={styles.noDataMessage}>
                    {searchTerm ? 'Нет результатов, соответствующих поисковому запросу.' : 'Нет связей операций со станками.'}
                </Typography>
            ) : (
                <div>
                    {Object.entries(groupedByMachine).map(([machineId, steps]) => (
                        <div key={machineId} style={{ marginBottom: '24px' }}>
                            <Typography variant="subtitle1" className={styles.sectionTitle}>
                                {getMachineName(Number(machineId))}
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow className={styles.tableHeader}>
                                            <TableCell>Операция</TableCell>
                                            <TableCell align="center">По умолчанию</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {steps.map(step => (
                                            <TableRow key={step.id}>
                                                <TableCell>{getOperationName(step.processStepId)}</TableCell>
                                                <TableCell align="center">
                                                    {step.isDefault ? (
                                                        <Chip
                                                            label="Да"
                                                            size="small"
                                                            className={styles.chipDefault}
                                                        />
                                                    ) : "Нет"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MachineOperationsList;
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
import { ISegmentProcessStep, IProcessStep, ISegment } from '../OperationsSettings';
import styles from './SegmentOperationsList.module.css';

interface SegmentOperationsListProps {
    segmentSteps: ISegmentProcessStep[];
    segments: ISegment[];
    operations: IProcessStep[];
}

const SegmentOperationsList: React.FC<SegmentOperationsListProps> = ({
    segmentSteps,
    segments,
    operations
}) => {
    // Состояние для поиска
    const [searchTerm, setSearchTerm] = useState('');

    // Функция для получения названия операции по ID
    const getOperationName = (operationId: number): string => {
        const operation = operations.find(op => op.id === operationId);
        return operation ? operation.name : 'Неизвестная операция';
    };

    // Функция для получения названия участка по ID
    const getSegmentName = (segmentId: number): string => {
        const segment = segments.find(s => s.id === segmentId);
        return segment ? segment.name : 'Неизвестный участок';
    };

    // Фильтрация шагов по поисковому запросу
    const filteredSteps = segmentSteps.filter(step => {
        const segmentName = getSegmentName(step.segmentId).toLowerCase();
        const operationName = getOperationName(step.processStepId).toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return segmentName.includes(searchLower) || operationName.includes(searchLower);
    });

    // Группировка шагов по участкам для удобного отображения
    const groupedBySegment: Record<number, ISegmentProcessStep[]> = {};
    filteredSteps.forEach(step => {
        if (!groupedBySegment[step.segmentId]) {
            groupedBySegment[step.segmentId] = [];
        }
        groupedBySegment[step.segmentId].push(step);
    });

    return (
        <div>
            <Typography variant="h6" style={{ marginBottom: '16px' }}>
                Связи операций с участками
            </Typography>

            <TextField
                fullWidth
                variant="outlined"
                placeholder="Поиск по названию участка или операции"
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
            
            {Object.keys(groupedBySegment).length === 0 ? (
                <Typography className={styles.noDataMessage}>
                    {searchTerm ? 'Нет результатов, соответствующих поисковому запросу.' : 'Нет связей операций с участками.'}
                </Typography>
            ) : (
                <div>
                    {Object.entries(groupedBySegment).map(([segmentId, steps]) => (
                        <div key={segmentId} style={{ marginBottom: '24px' }}>
                            <Typography variant="subtitle1" className={styles.sectionTitle}>
                                {getSegmentName(Number(segmentId))}
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow className={styles.tableHeader}>
                                            <TableCell>Операция</TableCell>
                                            <TableCell align="center">Основная</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {steps.map(step => (
                                            <TableRow key={step.id}>
                                                <TableCell>{getOperationName(step.processStepId)}</TableCell>
                                                <TableCell align="center">
                                                    {step.isPrimary ? (
                                                        <Chip
                                                            label="Да"
                                                            size="small"
                                                            className={styles.chipPrimary}
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

export default SegmentOperationsList;
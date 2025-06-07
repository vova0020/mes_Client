import React from 'react';
import {
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import { IProcessStep, IMachineProcessStep, ISegmentProcessStep } from '../OperationsSettings';
import styles from './OperationDetails.module.css';

interface OperationDetailsProps {
    selectedOperation: IProcessStep | null;
    parentOperations: IProcessStep[];
    childOperations: IProcessStep[];
    machineSteps: IMachineProcessStep[];
    segmentSteps: ISegmentProcessStep[];
}

const OperationDetails: React.FC<OperationDetailsProps> = ({
    selectedOperation,
    parentOperations,
    childOperations,
    machineSteps,
    segmentSteps
}) => {
    if (!selectedOperation) {
        return (
            <div className={styles.detailSection}>
                <Typography variant="h6" className={styles.sectionTitle}>
                    Детали операции
                </Typography>
                <Typography className={styles.noDataMessage}>
                    Выберите операцию из списка для просмотра подробной информации.
                </Typography>
            </div>
        );
    }

    return (
        <div className={styles.detailSection}>
            <Typography variant="h6" className={styles.sectionTitle}>
                Детали операции
            </Typography>

            <div className={styles.detailItem}>
                <Typography variant="subtitle1" className={styles.detailLabel}>
                    Название:
                </Typography>
                <Typography variant="body1" className={styles.detailValue}>
                    {selectedOperation.name}
                </Typography>
            </div>

            <div className={styles.detailItem}>
                <Typography variant="subtitle1" className={styles.detailLabel}>
                    Порядковый номер:
                </Typography>
                <Typography variant="body1" className={styles.detailValue}>
                    {selectedOperation.sequence}
                </Typography>
            </div>

            {selectedOperation.description && (
                <div className={styles.detailItem}>
                    <Typography variant="subtitle1" className={styles.detailLabel}>
                        Описание:
                    </Typography>
                    <Typography variant="body1" className={styles.detailValue}>
                        {selectedOperation.description}
                    </Typography>
                </div>
            )}

            <Divider style={{ margin: '16px 0' }} />

            {/* Родительские операции */}
            <Typography variant="subtitle1" className={styles.sectionTitle}>
                Предшествующие операции
            </Typography>
            {parentOperations.length > 0 ? (
                <Paper variant="outlined" style={{ marginBottom: '16px' }}>
                    <List dense>
                        {parentOperations.map(operation => (
                            <ListItem key={operation.id}>
                                <ListItemText
                                    primary={operation.name}
                                    secondary={`Порядковый номер: ${operation.sequence}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            ) : (
                <Typography className={styles.noDataMessage}>
                    Нет предшествующих операций.
                </Typography>
            )}

            {/* Дочерние операции */}
            <Typography variant="subtitle1" className={styles.sectionTitle}>
                Последующие операции
            </Typography>
            {childOperations.length > 0 ? (
                <Paper variant="outlined" style={{ marginBottom: '16px' }}>
                    <List dense>
                        {childOperations.map(operation => (
                            <ListItem key={operation.id}>
                                <ListItemText
                                    primary={operation.name}
                                    secondary={`Порядковый номер: ${operation.sequence}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            ) : (
                <Typography className={styles.noDataMessage}>
                    Нет последующих операций.
                </Typography>
            )}

            <Divider style={{ margin: '16px 0' }} />

            {/* Связи со станками */}
            <Typography variant="subtitle1" className={styles.sectionTitle}>
                Станки, выполняющие операцию
            </Typography>
            {machineSteps.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" className={styles.tableContainer}>
                    <Table size="small">
                        <TableHead>
                            <TableRow className={styles.tableHeader}>
                                <TableCell>Название станка</TableCell>
                                <TableCell align="center">По умолчанию</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {machineSteps.map(step => (
                                <TableRow key={step.id}>
                                    <TableCell>{step.machineName}</TableCell>
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
            ) : (
                <Typography className={styles.noDataMessage}>
                    Нет связанных станков.
                </Typography>
            )}

            {/* Связи с участками */}
            <Typography variant="subtitle1" className={styles.sectionTitle}>
                Участки, выполняющие операцию
            </Typography>
            {segmentSteps.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" className={styles.tableContainer}>
                    <Table size="small">
                        <TableHead>
                            <TableRow className={styles.tableHeader}>
                                <TableCell>Название участка</TableCell>
                                <TableCell align="center">Основной</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {segmentSteps.map(step => (
                                <TableRow key={step.id}>
                                    <TableCell>{step.segmentName}</TableCell>
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
            ) : (
                <Typography className={styles.noDataMessage}>
                    Нет связанных участков.
                </Typography>
            )}
        </div>
    );
};

export default OperationDetails;
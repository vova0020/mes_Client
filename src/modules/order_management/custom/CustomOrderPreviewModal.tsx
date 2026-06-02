import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Close as CloseIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import styles from './CustomOrderPreviewModal.module.css';
import { saveCustomOrderFromFile, Part } from '../../api/custom/order-management/customOrderManagementApi';
import { routeManagementApi, RouteInfoDto } from '../../api/routeManagementApi';

interface CustomFormData {
  orderNumber: string;
  orderName: string;
  requiredDate: string;
}

interface CustomOrderPreviewModalProps {
  open: boolean;
  onClose: () => void;
  parts: Part[];
  formData: CustomFormData;
  onSuccess?: () => void;
}

interface PartWithRoute extends Part {
  selectedRouteId?: number;
}

export const CustomOrderPreviewModal: React.FC<CustomOrderPreviewModalProps> = ({
  open,
  onClose,
  parts: initialParts,
  formData,
  onSuccess,
}) => {
  const [parts, setParts] = useState<PartWithRoute[]>([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderName, setOrderName] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [priority, setPriority] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<RouteInfoDto[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);

  // Загрузка доступных маршрутов
  useEffect(() => {
    const fetchRoutes = async () => {
      if (open) {
        setLoadingRoutes(true);
        try {
          const routes = await routeManagementApi.getRoutes();
          setAvailableRoutes(routes);
          console.log('Загружены маршруты:', routes);
        } catch (err) {
          console.error('Ошибка загрузки маршрутов:', err);
          setError('Не удалось загрузить список маршрутов');
        } finally {
          setLoadingRoutes(false);
        }
      }
    };

    fetchRoutes();
  }, [open]);

  // Обновляем состояние при изменении пропсов
  useEffect(() => {
    if (open) {
      console.log('=== PREVIEW MODAL OPENED ===');
      console.log('Form data received:', formData);
      console.log('Parts received:', initialParts.length);
      
      // Инициализируем детали с первым доступным маршрутом (если есть)
      const partsWithRoutes = initialParts.map(part => ({
        ...part,
        selectedRouteId: undefined // Пользователь должен выбрать маршрут вручную
      }));
      
      setParts(partsWithRoutes);
      setOrderNumber(formData.orderNumber);
      setOrderName(formData.orderName);
      setRequiredDate(formData.requiredDate);
      setPriority(1);
      setError(null);
      
      console.log('State updated:', {
        orderNumber: formData.orderNumber,
        orderName: formData.orderName,
        requiredDate: formData.requiredDate,
        partsCount: initialParts.length
      });
    }
  }, [open, initialParts, formData]);

  // Конфигурация всех возможных колонок (названия согласно вашим данным)
  const allColumns = [
    { key: 'partSku', label: 'Артикул Детали', editable: true, type: 'number' },
    { key: 'partCode', label: 'Код детали', editable: true, type: 'text' },
    { key: 'partName', label: 'Наименование', editable: true, type: 'text' },
    { key: 'materialName', label: 'Материал', editable: false, type: 'text' },
    { key: 'materialSku', label: 'Артикул Материала', editable: true, type: 'text' },
    { key: 'thickness', label: 'Толщина', editable: true, type: 'number' },
    { key: 'thicknessWithEdging', label: 'Толщина с Кромкой', editable: true, type: 'number' },
    { key: 'quantity', label: 'Кол-во', editable: true, type: 'number' },
    { key: 'blankLength', label: 'Длина Заготовки', editable: true, type: 'number' },
    { key: 'blankWidth', label: 'Ширина Заготовки', editable: true, type: 'number' },
    { key: 'finishedLength', label: 'Длина Готовой', editable: true, type: 'number' },
    { key: 'finishedWidth', label: 'Ширина Готовой', editable: true, type: 'number' },
    { key: 'groove', label: 'Паз', editable: true, type: 'text' },
    { key: 'edgingSkuL1', label: 'Артикул Кромки L1', editable: true, type: 'text' },
    { key: 'edgingNameL1', label: 'Кромка L1', editable: false, type: 'text' },
    { key: 'edgingSkuL2', label: 'Артикул Кромки L2', editable: true, type: 'text' },
    { key: 'edgingNameL2', label: 'Кромка L2', editable: false, type: 'text' },
    { key: 'edgingSkuW1', label: 'Артикул Кромки W1', editable: true, type: 'text' },
    { key: 'edgingNameW1', label: 'Кромка W1', editable: false, type: 'text' },
    { key: 'edgingSkuW2', label: 'Артикул Кромки W2', editable: true, type: 'text' },
    { key: 'edgingNameW2', label: 'Кромка W2', editable: false, type: 'text' },
    { key: 'plasticFace', label: 'Пластик Лицевой', editable: true, type: 'text' },
    { key: 'plasticFaceSku', label: 'Артикул Пластика Лицевого', editable: true, type: 'number' },
    { key: 'plasticBack', label: 'Пластик Тыльный', editable: true, type: 'text' },
    { key: 'plasticBackSku', label: 'Артикул Пластика Тыльного', editable: true, type: 'number' },
    { key: 'additionalMaterial', label: 'Дополнительный Материал', editable: true, type: 'text' },
    { key: 'pf', label: 'ПФ', editable: true, type: 'text' },
    { key: 'pfSku', label: 'Артикул ПФ', editable: true, type: 'number' },
    { key: 'sbPart', label: 'СБ Деталь', editable: true, type: 'text' },
    { key: 'pfSb', label: 'ПФ СБ', editable: true, type: 'text' },
    { key: 'sbPartSku', label: 'Артикул СБ Детали', editable: true, type: 'number' },
    { key: 'conveyorPosition', label: 'Позиция на Конвейере', editable: true, type: 'number' },
  ];

  // Определяем, какие колонки показывать
  const getVisibleColumns = () => {
    if (showAllColumns) {
      return allColumns;
    }
    
    // Показываем только колонки, где хотя бы у одной детали есть значение
    return allColumns.filter(column => {
      return parts.some(part => {
        const value = part[column.key as keyof PartWithRoute];
        return value !== null && value !== undefined && value !== '';
      });
    });
  };

  const visibleColumns = getVisibleColumns();

  const handleFieldChange = (index: number, field: keyof PartWithRoute, value: any) => {
    const updatedParts = [...parts];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    setParts(updatedParts);
  };

  const handleRouteChange = (index: number, routeId: number) => {
    const updatedParts = [...parts];
    updatedParts[index] = { ...updatedParts[index], selectedRouteId: routeId };
    setParts(updatedParts);
    console.log(`Маршрут для детали ${index + 1} изменен на:`, routeId);
  };

  const renderCellInput = (part: PartWithRoute, column: typeof allColumns[0], index: number) => {
    const value = part[column.key as keyof PartWithRoute];
    
    if (!column.editable) {
      return (
        <div className={styles.cellText} title={String(value || '-')}>
          {String(value || '-')}
        </div>
      );
    }

    if (column.type === 'number') {
      return (
        <input
          type="number"
          value={value as number || ''}
          onChange={(e) => handleFieldChange(index, column.key as keyof PartWithRoute, e.target.value ? Number(e.target.value) : null)}
          className={styles.cellInput}
          min="0"
          step={column.key.includes('thickness') || column.key.includes('Length') || column.key.includes('Width') ? '0.1' : '1'}
        />
      );
    }

    return (
      <input
        type="text"
        value={String(value || '')}
        onChange={(e) => handleFieldChange(index, column.key as keyof PartWithRoute, e.target.value || null)}
        className={styles.cellInput}
      />
    );
  };

  const handleSave = async () => {
    console.log('=== SAVING ORDER ===');
    console.log('Order Number:', orderNumber);
    console.log('Order Name:', orderName);
    console.log('Required Date:', requiredDate);
    console.log('Priority:', priority);
    console.log('Parts count:', parts.length);
    
    // Проверка, что все детали имеют выбранный маршрут
    const partsWithoutRoute = parts.filter(part => !part.selectedRouteId);
    if (partsWithoutRoute.length > 0) {
      setError(`Необходимо выбрать маршрут для всех деталей. Не выбран маршрут для ${partsWithoutRoute.length} детал(и/ей)`);
      return;
    }
    
    setIsSaving(true);
    setError(null);

    try {
      const orderData = {
        orderNumber,
        orderName,
        requiredDate,
        parts: parts.map(part => ({
          ...part,
          routeId: part.selectedRouteId // Добавляем выбранный маршрут
        })),
        priority,
      };

      console.log('Order data to send:', orderData);
      console.log('Parts with routes:', orderData.parts.map(p => ({ code: p.partCode, routeId: p.routeId })));

      const response = await saveCustomOrderFromFile(orderData);

      console.log('=== SAVE RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response success:', response.success);
      console.log('Response data:', response.data);

      if (response.success) {
        console.log('✅ Order saved successfully! Closing modal...');
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        console.error('❌ Save failed:', response.message);
        setError(response.message || 'Ошибка при сохранении заказа');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      className={styles.dialog}
    >
      <DialogTitle className={styles.dialogTitle}>
        <div className={styles.titleContent}>
          <CheckCircleIcon className={styles.successIcon} />
          <span>Предпросмотр заказа индивидуального производства</span>
        </div>
        <Button onClick={onClose} className={styles.closeButton}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent className={styles.dialogContent}>
        {error && (
          <Alert severity="error" className={styles.errorAlert} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Информация о заказе</h3>
          <div className={styles.formGrid}>
            <TextField
              label="Номер заказа"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              fullWidth
              size="small"
              className={styles.input}
            />
            <TextField
              label="Название заказа"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              fullWidth
              size="small"
              className={styles.input}
            />
            <TextField
              label="Требуемая дата"
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              className={styles.input}
            />
            <TextField
              label="Приоритет"
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              fullWidth
              size="small"
              inputProps={{ min: 1, max: 10 }}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.partsSection}>
          <div className={styles.partsSectionHeader}>
            <h3 className={styles.sectionTitle}>
              Детали ({parts.length} шт.)
            </h3>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowAllColumns(!showAllColumns)}
              className={styles.toggleColumnsButton}
            >
              {showAllColumns ? '📋 Скрыть пустые колонки' : '📊 Показать все колонки'}
              <span className={styles.columnCount}>
                ({showAllColumns ? allColumns.length : visibleColumns.length} из {allColumns.length})
              </span>
            </Button>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.partsTable}>
              <thead>
                <tr>
                  <th className={styles.stickyColumn}>№</th>
                  {visibleColumns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th>Маршрут *</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part, index) => (
                  <tr key={index}>
                    <td className={`${styles.indexCell} ${styles.stickyColumn}`}>{index + 1}</td>
                    {visibleColumns.map((column) => (
                      <td key={column.key} className={styles.dataCell}>
                        {renderCellInput(part, column, index)}
                      </td>
                    ))}
                    <td className={styles.routeCell}>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={part.selectedRouteId || ''}
                          onChange={(e) => handleRouteChange(index, Number(e.target.value))}
                          displayEmpty
                          disabled={loadingRoutes || isSaving}
                          className={styles.routeSelect}
                          error={!part.selectedRouteId}
                        >
                          <MenuItem value="" disabled>
                            <em>Выберите маршрут</em>
                          </MenuItem>
                          {availableRoutes.map((route) => (
                            <MenuItem key={route.routeId} value={route.routeId}>
                              {route.routeName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {loadingRoutes && (
          <Alert severity="info" className={styles.infoMessage}>
            <CircularProgress size={16} style={{ marginRight: '8px' }} />
            Загрузка доступных маршрутов...
          </Alert>
        )}
        
        {!loadingRoutes && availableRoutes.length === 0 && (
          <Alert severity="warning" className={styles.infoMessage}>
            Не удалось загрузить маршруты. Проверьте подключение к серверу.
          </Alert>
        )}
        
        {!loadingRoutes && availableRoutes.length > 0 && (
          <Alert severity="info" className={styles.infoMessage}>
            Проверьте данные перед сохранением. <strong>Обязательно выберите технологический маршрут для каждой детали.</strong> Детали будут добавлены в заказ индивидуального производства.
          </Alert>
        )}
      </DialogContent>

      <DialogActions className={styles.dialogActions}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={isSaving}
        >
          Отмена
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={isSaving || parts.length === 0}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить заказ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

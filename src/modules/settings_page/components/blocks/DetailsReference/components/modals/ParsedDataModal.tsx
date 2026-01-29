import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { ParsedDetail } from '../../../../../../api/parserApi/parserApi';
import { Route } from '../../../../../../api/detailsApi/detailsApi';
import styles from './ParsedDataModal.module.css';

// Словарь для перевода названий полей на русский язык
const fieldTranslations: Record<string, string> = {
  'partSku': 'Артикул детали',
  'partName': 'Наименование детали',
  'materialName': 'Наименование материала',
  'materialSku': 'Артикул материала',
  'thickness': 'Толщина детали',
  'thicknessWithEdging': 'Толщина с учетом облицовки пласти',
  'quantity': 'Количество',
  'finishedLength': 'Готовая деталь [L]',
  'finishedWidth': 'Готовая деталь [W]',
  'groove': 'Паз',
  'edgingSkuL1': 'Артикул облицовки кромки [L1]',
  'edgingNameL1': 'Наименование облицовки кромки [L1]',
  'edgingSkuL2': 'Артикул облицовки кромки [L2]',
  'edgingNameL2': 'Наименование облицовки кромки [L2]',
  'edgingSkuW1': 'Артикул облицовки кромки [W1]',
  'edgingNameW1': 'Наименование облицовки кромки [W1]',
  'edgingSkuW2': 'Артикул облицовки кромки [W2]',
  'edgingNameW2': 'Наименование облицовки кромки [W2]',
  'plasticFace': 'Пластик (лицевая)',
  'plasticFaceSku': 'Пластик (лицевая) артикул',
  'plasticBack': 'Пластик (нелицевая)',
  'plasticBackSku': 'Пластик (нелицевая) артикул',
  'pf': 'ПФ',
  'pfSku': 'Артикул ПФ (для детали)',
  'sbPart': 'СБ деталь',
  'pfSb': 'ПФ СБ',
  'sbPartSku': 'Артикул СБ детали (для ПФ СБ)',
  'conveyorPosition': 'Подстопное место на конвейере'
};

// Функция для получения русского названия поля
const getFieldDisplayName = (fieldName: string): string => {
  return fieldTranslations[fieldName] || fieldName;
};

interface ParsedDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedData: ParsedDetail[]) => Promise<void>;
  parsedData: ParsedDetail[];
  isLoading?: boolean;
  routes: Route[];
  routesLoading?: boolean;
}

export const ParsedDataModal: React.FC<ParsedDataModalProps> = ({
  isOpen,
  onClose,
  onSave,
  parsedData,
  isLoading = false,
  routes,
  routesLoading = false
}) => {
  const [editedData, setEditedData] = useState<ParsedDetail[]>([]);
  const [editingCell, setEditingCell] = useState<{row: number, field: string} | null>(null);
  const [showDiffsModal, setShowDiffsModal] = useState(false);
  const [selectedDiffs, setSelectedDiffs] = useState<any[]>([]);
  const [selectedDetailSku, setSelectedDetailSku] = useState<string>('');
  const [userModifiedRoutes, setUserModifiedRoutes] = useState<Set<number>>(new Set());

  // Синхронизируем локальное состояние с входными данными
  useEffect(() => {
    // Устанавливаем routeId из currentRouteId или первого доступного маршрута
    const dataWithRoutes = parsedData.map(detail => ({
      ...detail,
      routeId: detail.currentRouteId || detail.availableRoutes?.[0]?.routeId || detail.routeId || 0
    }));
    setEditedData(dataWithRoutes);
    setUserModifiedRoutes(new Set()); // Сбрасываем отметки при новых данных
  }, [parsedData]);

  const handleFieldChange = (index: number, field: string, value: any) => {
    const updated = [...editedData];
    if (field === 'quantity') {
      value = value ? parseFloat(value) : '';
    } else if (field === 'routeId') {
      value = parseInt(value) || 0;
      // Отмечаем, что пользователь изменил маршрут (даже если выбрал тот же)
      setUserModifiedRoutes(prev => new Set(prev).add(index));
    } else if (['thickness', 'thicknessWithEdging', 'finishedLength', 'finishedWidth', 'conveyorPosition'].includes(field)) {
      value = value ? parseFloat(value) : undefined;
    } else if (['pf', 'sbPart', 'pfSb'].includes(field)) {
      value = value === 'true' || value === true;
    }
    updated[index] = { ...updated[index], [field]: value };
    setEditedData(updated);
  };

  const handleSave = async () => {
    // Проверяем, что у всех деталей выбран маршрут
    const detailsWithoutRoute = editedData.filter(detail => !detail.routeId || detail.routeId === 0);
    if (detailsWithoutRoute.length > 0) {
      alert(`Необходимо выбрать маршрут для всех деталей. Не выбран маршрут для ${detailsWithoutRoute.length} деталей.`);
      return;
    }
    
    // Проверяем, что выбранный маршрут из доступных (если есть availableRoutes)
    const detailsWithInvalidRoute = editedData.filter(detail => {
      if (detail.availableRoutes && detail.availableRoutes.length > 0) {
        return !detail.availableRoutes.some(route => route.routeId === detail.routeId);
      }
      return false;
    });
    
    if (detailsWithInvalidRoute.length > 0) {
      alert(`Для некоторых деталей выбран недоступный маршрут. Проверьте выбор маршрутов.`);
      return;
    }
    
    try {
      await onSave(editedData);
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
    }
  };

  const handleViewDiffs = (detail: ParsedDetail) => {
    // Фильтруем различия, исключая поле quantity
    const filteredDiffs = (detail.diffs || []).filter(diff => diff.field !== 'quantity');
    setSelectedDiffs(filteredDiffs);
    setSelectedDetailSku(detail.partSku);
    setShowDiffsModal(true);
  };

  const renderEditableCell = (detail: ParsedDetail, index: number, field: string, value: any) => {
    const isEditing = editingCell?.row === index && editingCell?.field === field;
    
    if (isEditing) {
      if (['pf', 'sbPart', 'pfSb'].includes(field)) {
        return (
          <select
            value={value ? 'true' : 'false'}
            onChange={(e) => handleFieldChange(index, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            className={styles.editInput}
            autoFocus
          >
            <option value="false">Нет</option>
            <option value="true">Да</option>
          </select>
        );
      } else if (field === 'routeId') {
        return (
          <select
            value={value || 0}
            onChange={(e) => handleFieldChange(index, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            className={styles.editInput}
            autoFocus
          >
            <option value={0}>Выберите маршрут</option>
            {routes.map(route => (
              <option key={route.routeId} value={route.routeId}>
                {route.routeName}
              </option>
            ))}
          </select>
        );
      } else {
        const inputType = ['thickness', 'thicknessWithEdging', 'finishedLength', 'finishedWidth', 'quantity'].includes(field) ? 'number' : 'text';
        return (
          <input
            type={inputType}
            value={value || ''}
            onChange={(e) => handleFieldChange(index, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
            className={styles.editInput}
            autoFocus
          />
        );
      }
    }
    
    const displayValue = ['pf', 'sbPart', 'pfSb'].includes(field) 
      ? (value ? 'Да' : 'Нет')
      : (value ?? '–');
    
    return (
      <div 
        className={styles.editableCell}
        onClick={() => setEditingCell({row: index, field})}
        title="Нажмите для редактирования"
      >
        {displayValue}
        <PencilIcon className={styles.editIcon} />
      </div>
    );
  };

  const getStatusBadge = (detail: ParsedDetail) => {
    if (detail.detailExists) {
      if (detail.hasPackageConnection) {
        return <span className={`${styles.badge} ${styles.badgeConnected}`}>Связана</span>;
      } else {
        return <span className={`${styles.badge} ${styles.badgeExists}`}>Существует</span>;
      }
    } else {
      return <span className={`${styles.badge} ${styles.badgeNew}`}>Новая</span>;
    }
  };

  const getDiffsInfo = (diffs: any[]) => {
    // Фильтруем различия, исключая поле quantity
    const filteredDiffs = (diffs || []).filter(diff => diff.field !== 'quantity');
    if (!filteredDiffs || filteredDiffs.length === 0) return null;
    
    return (
      <div className={styles.diffsInfo}>
        <ExclamationTriangleIcon className={styles.warningIcon} />
        <span>Найдено {filteredDiffs.length} различий с БД</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Результаты парсинга файла</h2>
          <button onClick={onClose} className={styles.closeButton} disabled={isLoading}>
            <XMarkIcon className={styles.icon} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <InformationCircleIcon className={styles.infoIcon} />
              <span>Найдено деталей: {editedData.length}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={`${styles.badge} ${styles.badgeNew}`}>
                Новых: {editedData.filter(d => !d.detailExists).length}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={`${styles.badge} ${styles.badgeExists}`}>
                Существующих: {editedData.filter(d => d.detailExists && !d.hasPackageConnection).length}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={`${styles.badge} ${styles.badgeConnected}`}>
                Уже связанных: {editedData.filter(d => d.hasPackageConnection).length}
              </span>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Статус</th>
                  <th>Артикул детали</th>
                  <th>Наименование детали</th>
                  <th>Маршрут</th>
                  <th>Количество</th>
                  <th>Наименование материала</th>
                  <th>Артикул материала</th>
                  <th>Толщина детали</th>
                  <th>Толщина с облицовкой</th>
                  <th>Готовая деталь [L]</th>
                  <th>Готовая деталь [W]</th>
                  <th>Паз</th>
                  <th>Облицовка L1</th>
                  <th>Облицовка L2</th>
                  <th>Облицовка W1</th>
                  <th>Облицовка W2</th>
                  <th>Пластик (лицевая)</th>
                  <th>Пластик (нелицевая)</th>
                  <th>ПФ</th>
                  <th>Артикул ПФ</th>
                  <th>СБ деталь</th>
                  <th>ПФ СБ</th>
                  <th>Артикул СБ детали</th>
                  <th>Подстопное место</th>
                  <th>Различия</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {editedData.map((detail, index) => (
                  <tr key={index} className={styles.tableRow}>
                    <td>{getStatusBadge(detail)}</td>
                    <td>
                      <span className={styles.skuBadge}>{detail.partSku}</span>
                    </td>
                    <td>{renderEditableCell(detail, index, 'partName', detail.partName)}</td>
                    <td>
                      {detail.availableRoutes && detail.availableRoutes.length > 0 ? (
                        <select
                          value={detail.routeId || 0}
                          onChange={(e) => handleFieldChange(index, 'routeId', parseInt(e.target.value))}
                          onClick={() => setUserModifiedRoutes(prev => new Set(prev).add(index))}
                          className={`${styles.routeSelect} ${
                            (!detail.routeId || detail.routeId === 0) 
                              ? styles.routeSelectError 
                              : !userModifiedRoutes.has(index) 
                                ? styles.routeSelectAuto 
                                : ''
                          }`}
                          disabled={routesLoading}
                        >
                          <option value={0}>Выберите маршрут</option>
                          {detail.availableRoutes.map(route => (
                            <option key={route.routeId} value={route.routeId}>
                              {route.routeName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={detail.routeId || 0}
                          onChange={(e) => handleFieldChange(index, 'routeId', parseInt(e.target.value))}
                          onClick={() => setUserModifiedRoutes(prev => new Set(prev).add(index))}
                          className={`${styles.routeSelect} ${
                            (!detail.routeId || detail.routeId === 0) 
                              ? styles.routeSelectError 
                              : !userModifiedRoutes.has(index) 
                                ? styles.routeSelectAuto 
                                : ''
                          }`}
                          disabled={routesLoading}
                        >
                          <option value={0}>Выберите маршрут</option>
                          {routes.map(route => (
                            <option key={route.routeId} value={route.routeId}>
                              {route.routeName}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {editingCell?.row === index && editingCell?.field === 'quantity' ? (
                        <div className={styles.quantityEdit}>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={detail.quantity}
                            onChange={(e) => handleFieldChange(index, 'quantity', e.target.value ? parseFloat(e.target.value) : '')}
                            className={styles.quantityInput}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                            autoFocus
                          />
                          <button
                            onClick={() => setEditingCell(null)}
                            className={styles.saveQuantityBtn}
                          >
                            <CheckIcon className={styles.icon} />
                          </button>
                        </div>
                      ) : (
                        <div className={styles.quantityDisplay}>
                          <span className={styles.quantityBadge}>{detail.quantity}</span>
                          <button
                            onClick={() => setEditingCell({row: index, field: 'quantity'})}
                            className={styles.editQuantityBtn}
                            title="Редактировать количество"
                          >
                            <PencilIcon className={styles.icon} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td>{renderEditableCell(detail, index, 'materialName', detail.materialName)}</td>
                    <td>{renderEditableCell(detail, index, 'materialSku', detail.materialSku)}</td>
                    <td>{renderEditableCell(detail, index, 'thickness', detail.thickness)}</td>
                    <td>{renderEditableCell(detail, index, 'thicknessWithEdging', detail.thicknessWithEdging)}</td>
                    <td>{renderEditableCell(detail, index, 'finishedLength', detail.finishedLength)}</td>
                    <td>{renderEditableCell(detail, index, 'finishedWidth', detail.finishedWidth)}</td>
                    <td>{renderEditableCell(detail, index, 'groove', detail.groove)}</td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {renderEditableCell(detail, index, 'edgingSkuL1', detail.edgingSkuL1)}
                        {renderEditableCell(detail, index, 'edgingNameL1', detail.edgingNameL1)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {renderEditableCell(detail, index, 'edgingSkuL2', detail.edgingSkuL2)}
                        {renderEditableCell(detail, index, 'edgingNameL2', detail.edgingNameL2)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {renderEditableCell(detail, index, 'edgingSkuW1', detail.edgingSkuW1)}
                        {renderEditableCell(detail, index, 'edgingNameW1', detail.edgingNameW1)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {renderEditableCell(detail, index, 'edgingSkuW2', detail.edgingSkuW2)}
                        {renderEditableCell(detail, index, 'edgingNameW2', detail.edgingNameW2)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.plasticInfo}>
                        {renderEditableCell(detail, index, 'plasticFace', detail.plasticFace)}
                        {renderEditableCell(detail, index, 'plasticFaceSku', detail.plasticFaceSku)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.plasticInfo}>
                        {renderEditableCell(detail, index, 'plasticBack', detail.plasticBack)}
                        {renderEditableCell(detail, index, 'plasticBackSku', detail.plasticBackSku)}
                      </div>
                    </td>
                    <td>{renderEditableCell(detail, index, 'pf', detail.pf)}</td>
                    <td>{renderEditableCell(detail, index, 'pfSku', detail.pfSku)}</td>
                    <td>{renderEditableCell(detail, index, 'sbPart', detail.sbPart)}</td>
                    <td>{renderEditableCell(detail, index, 'pfSb', detail.pfSb)}</td>
                    <td>{renderEditableCell(detail, index, 'sbPartSku', detail.sbPartSku)}</td>
                <td>{renderEditableCell(detail, index, 'conveyorPosition', detail.conveyorPosition)}</td>
                    <td>
                      {getDiffsInfo(detail.diffs)}
                    </td>
                    <td>
                      {detail.diffs && detail.diffs.length > 0 && (
                        <button
                          className={styles.viewDiffsBtn}
                          title="Посмотреть различия"
                          onClick={() => handleViewDiffs(detail)}
                        >
                          <EyeIcon className={styles.icon} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <InformationCircleIcon className={styles.infoIcon} />
            <span>Фиолетовым выделены автоматически выбранные маршруты</span>
          </div>
          <div className={styles.footerActions}>
            <button
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить детали'}
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно для просмотра различий */}
      {showDiffsModal && (
        <div className={styles.diffsOverlay}>
          <div className={styles.diffsModal}>
            <div className={styles.diffsHeader}>
              <h3>Различия для детали: {selectedDetailSku}</h3>
              <button 
                onClick={() => setShowDiffsModal(false)} 
                className={styles.closeButton}
              >
                <XMarkIcon className={styles.icon} />
              </button>
            </div>
            <div className={styles.diffsContent}>
              {selectedDiffs.length === 0 ? (
                <p>Различий не найдено</p>
              ) : (
                <div className={styles.diffsTable}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Поле</th>
                        <th>Значение в БД</th>
                        <th>Значение в файле</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDiffs.map((diff, index) => (
                        <tr key={index}>
                          <td className={styles.fieldName}>{getFieldDisplayName(diff.field)}</td>
                          <td className={styles.dbValue}>
                            {diff.dbValue !== null && diff.dbValue !== undefined 
                              ? String(diff.dbValue) 
                              : '–'
                            }
                          </td>
                          <td className={styles.parsedValue}>
                            {diff.parsedValue !== null && diff.parsedValue !== undefined 
                              ? String(diff.parsedValue) 
                              : '–'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className={styles.diffsFooter}>
              <button 
                onClick={() => setShowDiffsModal(false)}
                className={styles.closeBtn}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
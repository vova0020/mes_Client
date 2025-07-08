import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { ParsedDetail } from '../../../api/parserApi/parserApi';
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
}

export const ParsedDataModal: React.FC<ParsedDataModalProps> = ({
  isOpen,
  onClose,
  onSave,
  parsedData,
  isLoading = false
}) => {
  const [editedData, setEditedData] = useState<ParsedDetail[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showDiffsModal, setShowDiffsModal] = useState(false);
  const [selectedDiffs, setSelectedDiffs] = useState<any[]>([]);
  const [selectedDetailSku, setSelectedDetailSku] = useState<string>('');

  // Синхронизируем локальное состояние с входными данными
  useEffect(() => {
    setEditedData([...parsedData]);
  }, [parsedData]);

  const handleQuantityChange = (index: number, newQuantity: number) => {
    const updated = [...editedData];
    updated[index] = { ...updated[index], quantity: Math.max(1, newQuantity) };
    setEditedData(updated);
  };

  const handleSave = async () => {
    try {
      await onSave(editedData);
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
    }
  };

  const handleViewDiffs = (detail: ParsedDetail) => {
    setSelectedDiffs(detail.diffs || []);
    setSelectedDetailSku(detail.partSku);
    setShowDiffsModal(true);
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
    if (!diffs || diffs.length === 0) return null;
    
    return (
      <div className={styles.diffsInfo}>
        <ExclamationTriangleIcon className={styles.warningIcon} />
        <span>Найдено {diffs.length} различий с БД</span>
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
                  <th>Количество</th>
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
                    <td className={styles.nameCell}>{detail.partName}</td>
                    <td>{detail.materialName}</td>
                    <td><span className={styles.materialSku}>{detail.materialSku}</span></td>
                    <td>{detail.thickness ?? '–'}</td>
                    <td>{detail.thicknessWithEdging ?? '–'}</td>
                    <td>{detail.finishedLength ?? '–'}</td>
                    <td>{detail.finishedWidth ?? '–'}</td>
                    <td>{detail.groove ?? '–'}</td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {detail.edgingSkuL1 && <span className={styles.edgingSku}>{detail.edgingSkuL1}</span>}
                        {detail.edgingNameL1 && <span className={styles.edgingName}>{detail.edgingNameL1}</span>}
                        {!detail.edgingSkuL1 && !detail.edgingNameL1 && '–'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {detail.edgingSkuL2 && <span className={styles.edgingSku}>{detail.edgingSkuL2}</span>}
                        {detail.edgingNameL2 && <span className={styles.edgingName}>{detail.edgingNameL2}</span>}
                        {!detail.edgingSkuL2 && !detail.edgingNameL2 && '–'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {detail.edgingSkuW1 && <span className={styles.edgingSku}>{detail.edgingSkuW1}</span>}
                        {detail.edgingNameW1 && <span className={styles.edgingName}>{detail.edgingNameW1}</span>}
                        {!detail.edgingSkuW1 && !detail.edgingNameW1 && '–'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {detail.edgingSkuW2 && <span className={styles.edgingSku}>{detail.edgingSkuW2}</span>}
                        {detail.edgingNameW2 && <span className={styles.edgingName}>{detail.edgingNameW2}</span>}
                        {!detail.edgingSkuW2 && !detail.edgingNameW2 && '–'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.plasticInfo}>
                        {detail.plasticFace && <span className={styles.plasticName}>{detail.plasticFace}</span>}
                        {detail.plasticFaceSku && <span className={styles.plasticSku}>{detail.plasticFaceSku}</span>}
                        {!detail.plasticFace && !detail.plasticFaceSku && '–'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.plasticInfo}>
                        {detail.plasticBack && <span className={styles.plasticName}>{detail.plasticBack}</span>}
                        {detail.plasticBackSku && <span className={styles.plasticSku}>{detail.plasticBackSku}</span>}
                        {!detail.plasticBack && !detail.plasticBackSku && '–'}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${detail.pf ? styles.badgeYes : styles.badgeNo}`}>
                        {detail.pf ? 'Да' : 'Нет'}
                      </span>
                    </td>
                    <td>{detail.pfSku ?? '–'}</td>
                    <td>
                      <span className={`${styles.badge} ${detail.sbPart ? styles.badgeYes : styles.badgeNo}`}>
                        {detail.sbPart ? 'Да' : 'Нет'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${detail.pfSb ? styles.badgeYes : styles.badgeNo}`}>
                        {detail.pfSb ? 'Да' : 'Нет'}
                      </span>
                    </td>
                    <td>{detail.sbPartSku ?? '–'}</td>
                    <td>{detail.conveyorPosition ?? '–'}</td>
                    <td>
                      {editingIndex === index ? (
                        <div className={styles.quantityEdit}>
                          <input
                            type="number"
                            min="1"
                            value={detail.quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                            className={styles.quantityInput}
                            autoFocus
                          />
                          <button
                            onClick={() => setEditingIndex(null)}
                            className={styles.saveQuantityBtn}
                          >
                            <CheckIcon className={styles.icon} />
                          </button>
                        </div>
                      ) : (
                        <div className={styles.quantityDisplay}>
                          <span className={styles.quantityBadge}>{detail.quantity}</span>
                          <button
                            onClick={() => setEditingIndex(index)}
                            className={styles.editQuantityBtn}
                            title="Редактировать количество"
                          >
                            <PencilIcon className={styles.icon} />
                          </button>
                        </div>
                      )}
                    </td>
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
            <span>Проверьте количество деталей перед сохранением</span>
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
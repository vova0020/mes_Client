import React, { useState } from 'react';
import styles from './OrderPreviewModal.module.css';

interface ParsedPackage {
  code: string;
  name: string;
  quantity: number;
  exists?: boolean;
  existingPackage?: {
    packageId: number;
    packageCode: string;
    packageName: string;
  };
}

interface UploadResponse {
  message: string;
  filename: string;
  data: {
    packages: ParsedPackage[];
    missingPackages: string[];
    allExist: boolean;
  };
}

interface CustomFormData {
  batchNumber: string;
  orderName: string;
  requiredDate: string;
}

interface OrderPreviewModalProps {
  data: UploadResponse;
  onClose: () => void;
  onSuccess: () => void;
  isEditMode?: boolean;
  onEditSuccess?: (parsedPackages: ParsedPackage[]) => void;
  isCustomProduction?: boolean;
  customFormData?: CustomFormData;
}

interface SaveResponse {
  message: string;
  orderId: number;
  batchNumber: string;
  packagesCount: number;
}

export const OrderPreviewModal: React.FC<OrderPreviewModalProps> = ({
  data,
  onClose,
  onSuccess,
  isEditMode = false,
  onEditSuccess,
  isCustomProduction = false,
  customFormData,
}) => {
  const [packages, setPackages] = useState<ParsedPackage[]>(data.data.packages);
  const [batchNumber, setBatchNumber] = useState(customFormData?.batchNumber || '');
  const [orderName, setOrderName] = useState(customFormData?.orderName || '');
  const [requiredDate, setRequiredDate] = useState(customFormData?.requiredDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [saveResult, setSaveResult] = useState<SaveResponse | null>(null);

  const handleFieldChange = (index: number, field: 'code' | 'name' | 'quantity', value: string | number) => {
    setPackages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleRemovePackage = (index: number) => {
    setPackages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Режим редактирования - просто передаем данные назад
    if (isEditMode && onEditSuccess) {
      onEditSuccess(packages);
      return;
    }

    if (!batchNumber.trim()) {
      setError('Введите номер партии');
      return;
    }
    if (!orderName.trim()) {
      setError('Введите название заказа');
      return;
    }
    if (!requiredDate) {
      setError('Выберите дату выполнения');
      return;
    }
    if (packages.length === 0) {
      setError('Добавьте хотя бы одну упаковку');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/order-management/save-from-file`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batchNumber,
            orderName,
            requiredDate: new Date(requiredDate).toISOString(),
            packages: packages.map((p) => ({
              code: p.code,
              name: p.name,
              quantity: p.quantity,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка сохранения заказа');
      }

      const result: SaveResponse = await response.json();
      setSaveResult(result);
      
      window.dispatchEvent(new CustomEvent('orderUpdated'));
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении заказа');
    } finally {
      setSaving(false);
    }
  };

  if (saveResult) {
    return (
      <div className={styles.modalOverlay} onClick={onSuccess}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                <span className={styles.formIcon}>✅</span>
                Заказ успешно создан
              </h2>
              <button
                onClick={onSuccess}
                className={styles.closeButton}
                type="button"
                title="Закрыть"
              >
                ×
              </button>
            </div>

            <div className={styles.formContent}>
              <div className={styles.resultSummary}>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>ID заказа:</span>
                  <span className={styles.resultValue}>{saveResult.orderId}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Номер партии:</span>
                  <span className={styles.resultValue}>{saveResult.batchNumber}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Упаковок:</span>
                  <span className={styles.resultValue}>{saveResult.packagesCount}</span>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  onClick={onSuccess}
                  className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonLarge}`}
                >
                  <span className={styles.buttonIcon}>✓</span>
                  Готово
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              <span className={styles.formIcon}>{isCustomProduction ? '⚙️' : '📋'}</span>
              {isEditMode ? `Выбор упаковок (${packages.length} упаковок)` :
               isCustomProduction ? `Проверка заказа индивидуального производства (${packages.length} упаковок)` :
               `Создание заказа (${packages.length} упаковок)`}
            </h2>
            <button
              onClick={onClose}
              className={styles.closeButton}
              type="button"
              title="Закрыть"
            >
              ×
            </button>
          </div>

          <div className={styles.formContent}>
            {error && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            {data.data.missingPackages.length > 0 && (
              <div className={styles.warningMessage}>
                <span className={styles.warningIcon}>⚠️</span>
                <div>
                  <strong>Внимание!</strong> Следующие упаковки не найдены в базе:
                  <div className={styles.missingList}>
                    {data.data.missingPackages.join(', ')}
                  </div>
                </div>
              </div>
            )}

            {!isEditMode && (
              <div className={styles.orderInfoSection}>
                <h3 className={styles.sectionTitle}>Информация о заказе</h3>
                
                {isCustomProduction && (
                  <div className={styles.infoMessage}>
                    <span className={styles.infoIcon}>ℹ️</span>
                    Данные заполнены из формы. API для сохранения индивидуальных заказов будет добавлен позже.
                  </div>
                )}
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Номер партии *</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className={styles.input}
                  placeholder="BATCH-2024-001"
                  disabled={saving || isCustomProduction}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Название заказа *</label>
                <input
                  type="text"
                  value={orderName}
                  onChange={(e) => setOrderName(e.target.value)}
                  className={styles.input}
                  placeholder="Заказ январь 2024"
                  disabled={saving || isCustomProduction}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Дата выполнения *</label>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className={styles.input}
                  disabled={saving || isCustomProduction}
                />
              </div>
            </div>
            )}

            <div className={styles.packagesSection}>
              <h3 className={styles.sectionTitle}>Упаковки</h3>
              
              <div className={styles.tableWrapper}>
                <table className={styles.packagesTable}>
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Артикул</th>
                      <th>Наименование</th>
                      <th>Количество</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((pkg, index) => (
                      <tr key={index} className={pkg.exists ? '' : styles.rowMissing}>
                        <td>{index + 1}</td>
                        <td className={styles.codeCell}>
                          <input
                            type="text"
                            value={pkg.code}
                            onChange={(e) => handleFieldChange(index, 'code', e.target.value)}
                            className={styles.editableInput}
                            disabled={saving}
                          />
                        </td>
                        <td className={styles.nameCell}>
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                            className={styles.editableInput}
                            disabled={saving}
                          />
                        </td>
                        <td className={styles.quantityCell}>
                          <input
                            type="number"
                            min="1"
                            value={pkg.quantity}
                            onChange={(e) => handleFieldChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                            className={styles.editableInput}
                            disabled={saving}
                          />
                        </td>
                        <td>
                          {pkg.exists ? (
                            <span className={styles.statusFound}>✓ Найдена</span>
                          ) : (
                            <span className={styles.statusMissing}>✗ Не найдена</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleRemovePackage(index)}
                            className={styles.deleteButton}
                            disabled={saving}
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.stats}>
                <span className={styles.statsItem}>
                  Всего упаковок: {packages.length}
                </span>
                <span className={styles.statsItem}>
                  Найдено: {packages.filter((p) => p.exists).length}
                </span>
                <span className={styles.statsItem}>
                  Не найдено: {packages.filter((p) => !p.exists).length}
                </span>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || packages.length === 0 || isCustomProduction}
                className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonLarge}`}
                title={isCustomProduction ? 'API для индивидуального производства будет добавлен позже' : ''}
              >
                {saving ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    Сохраняем...
                  </>
                ) : (
                  <>
                    <span className={styles.buttonIcon}>{isEditMode ? '✓' : '💾'}</span>
                    {isEditMode ? 'Применить' : isCustomProduction ? 'Создать заказ (API в разработке)' : 'Создать заказ'}
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonLarge}`}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

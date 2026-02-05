import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import styles from './MaterialPreviewModal.module.css';

interface ParsedMaterial {
  code: string;
  name: string;
  exists?: boolean;
  existingMaterial?: {
    materialId: number;
    materialName: string;
    article: string;
    unit: string;
  };
}

interface UploadResponse {
  message: string;
  filename: string;
  data: ParsedMaterial[];
  groupId: number;
}

interface MaterialWithUnit extends ParsedMaterial {
  unit: string;
}

interface MaterialPreviewModalProps {
  data: UploadResponse;
  onClose: () => void;
  onSuccess: () => void;
}

interface SaveResponse {
  created: Array<{ code: string; name: string; materialId: number }>;
  updated: Array<{ code: string; name: string; materialId: number }>;
  errors: Array<{ code: string; message: string }>;
}

export const MaterialPreviewModal: React.FC<MaterialPreviewModalProps> = ({
  data,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [materials, setMaterials] = useState<MaterialWithUnit[]>(
    data.data.map((m) => ({ 
      ...m, 
      unit: m.existingMaterial?.unit || '' 
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [saveResult, setSaveResult] = useState<SaveResponse | null>(null);

  const units = ['шт', 'кг', 'м', 'м²', 'м³'];

  const handleUnitChange = (index: number, unit: string) => {
    setMaterials((prev) =>
      prev.map((m, i) => (i === index ? { ...m, unit } : m))
    );
  };

  const handleFieldChange = (index: number, field: 'code' | 'name', value: string) => {
    setMaterials((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const handleSetAllUnits = (unit: string) => {
    setMaterials((prev) => prev.map((m) => ({ ...m, unit })));
  };

  const allUnitsSelected = materials.every((m) => m.unit);

  const handleSave = async () => {
    if (!allUnitsSelected) {
      setError('Выберите единицу измерения для всех материалов');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/settings/materials/save-from-file`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId: data.groupId,
            materials: materials.map((m) => ({
              code: m.code,
              name: m.name,
              unit: m.unit,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка сохранения материалов');
      }

      const result: SaveResponse = await response.json();
      setSaveResult(result);
      
      // Инвалидируем кэш React Query для обновления данных
      queryClient.invalidateQueries({ queryKey: ['material-groups'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении материалов');
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
                Результаты сохранения
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
                {saveResult.created.length > 0 && (
                  <div className={styles.resultItem}>
                    <span className={styles.resultIcon}>✅</span>
                    <span className={styles.resultText}>
                      Создано: {saveResult.created.length}
                    </span>
                  </div>
                )}
                {saveResult.updated.length > 0 && (
                  <div className={styles.resultItem}>
                    <span className={styles.resultIcon}>🔄</span>
                    <span className={styles.resultText}>
                      Обновлено: {saveResult.updated.length}
                    </span>
                  </div>
                )}
                {saveResult.errors.length > 0 && (
                  <div className={styles.resultItem}>
                    <span className={styles.resultIcon}>⚠️</span>
                    <span className={styles.resultText}>
                      Ошибок: {saveResult.errors.length}
                    </span>
                  </div>
                )}
              </div>

              {saveResult.errors.length > 0 && (
                <div className={styles.errorsList}>
                  <h3 className={styles.errorsTitle}>Ошибки:</h3>
                  {saveResult.errors.map((err, idx) => (
                    <div key={idx} className={styles.errorItem}>
                      <span className={styles.errorCode}>{err.code}</span>
                      <span className={styles.errorMessage}>{err.message}</span>
                    </div>
                  ))}
                </div>
              )}

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
              <span className={styles.formIcon}>📋</span>
              Предварительный просмотр ({materials.length} материалов)
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

            <div className={styles.infoMessage}>
              <span className={styles.infoIcon}>💡</span>
              Выберите единицу измерения для каждого материала перед сохранением
            </div>

            {/* Быстрое назначение единиц */}
            <div className={styles.quickActions}>
              <span className={styles.quickActionsLabel}>Применить ко всем:</span>
              <div className={styles.quickActionsButtons}>
                {units.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleSetAllUnits(unit)}
                    className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                    disabled={saving}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Таблица материалов */}
            <div className={styles.tableWrapper}>
              <table className={styles.materialsTable}>
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Артикул</th>
                    <th>Наименование</th>
                    <th>Единица измерения *</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material, index) => (
                    <tr key={index} className={!material.unit ? styles.rowIncomplete : material.exists ? styles.rowUpdate : ''}>
                      <td>{index + 1}</td>
                      <td className={styles.codeCell}>
                        <input
                          type="text"
                          value={material.code}
                          onChange={(e) => handleFieldChange(index, 'code', e.target.value)}
                          className={styles.editableInput}
                          disabled={saving}
                        />
                        {material.exists && (
                          <span className={styles.existsBadge} title="Материал будет обновлен">
                            🔄
                          </span>
                        )}
                      </td>
                      <td className={styles.nameCell}>
                        <input
                          type="text"
                          value={material.name}
                          onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                          className={styles.editableInput}
                          disabled={saving}
                        />
                        {material.exists && material.existingMaterial && (
                          <div className={styles.oldName}>
                            Старое: {material.existingMaterial.materialName}
                          </div>
                        )}
                      </td>
                      <td className={styles.unitCell}>
                        <select
                          value={material.unit}
                          onChange={(e) => handleUnitChange(index, e.target.value)}
                          className={`${styles.unitSelect} ${!material.unit ? styles.unitSelectEmpty : ''}`}
                          disabled={saving}
                        >
                          <option value="">Выберите</option>
                          {units.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Статистика */}
            <div className={styles.stats}>
              <span className={styles.statsItem}>
                Всего материалов: {materials.length}
              </span>
              <span className={styles.statsItem}>
                Новых: {materials.filter((m) => !m.exists).length}
              </span>
              <span className={styles.statsItem}>
                Обновлений: {materials.filter((m) => m.exists).length}
              </span>
              <span className={styles.statsItem}>
                Заполнено: {materials.filter((m) => m.unit).length}
              </span>
              {!allUnitsSelected && (
                <span className={styles.statsWarning}>
                  ⚠️ Не все единицы измерения выбраны
                </span>
              )}
            </div>

            {/* Кнопки действий */}
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleSave}
                disabled={!allUnitsSelected || saving}
                className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonLarge}`}
              >
                {saving ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    Сохраняем...
                  </>
                ) : (
                  <>
                    <span className={styles.buttonIcon}>💾</span>
                    Сохранить материалы
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

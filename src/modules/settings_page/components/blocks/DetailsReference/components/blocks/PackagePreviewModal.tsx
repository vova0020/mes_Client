import React, { useState } from 'react';
import styles from './PackagePreviewModal.module.css';

interface ParsedPackage {
  code: string;
  name: string;
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
  data: ParsedPackage[];
}

interface PackagePreviewModalProps {
  data: UploadResponse;
  onClose: () => void;
  onSuccess: () => void;
}

interface SaveResponse {
  created: Array<{ code: string; name: string; packageId: number }>;
  updated: Array<{ code: string; name: string; packageId: number }>;
  errors: Array<{ code: string; message: string }>;
}

export const PackagePreviewModal: React.FC<PackagePreviewModalProps> = ({
  data,
  onClose,
  onSuccess,
}) => {
  const [packages, setPackages] = useState<ParsedPackage[]>(data.data);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [saveResult, setSaveResult] = useState<SaveResponse | null>(null);

  const handleFieldChange = (index: number, field: 'code' | 'name', value: string) => {
    setPackages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/package-directory/save-from-file`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            packages: packages.map((p) => ({
              code: p.code,
              name: p.name,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка сохранения упаковок');
      }

      const result: SaveResponse = await response.json();
      setSaveResult(result);
      
      // Отправляем событие для обновления данных
      window.dispatchEvent(new CustomEvent('packageDirectoryUpdated'));
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении упаковок');
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
              Предварительный просмотр ({packages.length} упаковок)
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
              Проверьте данные перед сохранением. Вы можете отредактировать любое поле.
            </div>

            {/* Таблица упаковок */}
            <div className={styles.tableWrapper}>
              <table className={styles.packagesTable}>
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Артикул</th>
                    <th>Наименование</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg, index) => (
                    <tr key={index} className={pkg.exists ? styles.rowUpdate : ''}>
                      <td>{index + 1}</td>
                      <td className={styles.codeCell}>
                        <input
                          type="text"
                          value={pkg.code}
                          onChange={(e) => handleFieldChange(index, 'code', e.target.value)}
                          className={styles.editableInput}
                          disabled={saving}
                        />
                        {pkg.exists && (
                          <span className={styles.existsBadge} title="Упаковка будет обновлена">
                            🔄
                          </span>
                        )}
                      </td>
                      <td className={styles.nameCell}>
                        <input
                          type="text"
                          value={pkg.name}
                          onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                          className={styles.editableInput}
                          disabled={saving}
                        />
                        {pkg.exists && pkg.existingPackage && (
                          <div className={styles.oldName}>
                            Старое: {pkg.existingPackage.packageName}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Статистика */}
            <div className={styles.stats}>
              <span className={styles.statsItem}>
                Всего упаковок: {packages.length}
              </span>
              <span className={styles.statsItem}>
                Новых: {packages.filter((p) => !p.exists).length}
              </span>
              <span className={styles.statsItem}>
                Обновлений: {packages.filter((p) => p.exists).length}
              </span>
            </div>

            {/* Кнопки действий */}
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
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
                    Сохранить упаковки
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

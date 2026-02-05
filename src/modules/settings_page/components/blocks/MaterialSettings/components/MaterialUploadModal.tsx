import React, { useState, useRef } from 'react';
import { useMaterialGroups } from '../api';
import { MaterialPreviewModal } from './MaterialPreviewModal';
import styles from './MaterialUploadModal.module.css';

interface MaterialUploadModalProps {
  onClose: () => void;
}

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

export const MaterialUploadModal: React.FC<MaterialUploadModalProps> = ({ onClose }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [parsedData, setParsedData] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: groups = [], isLoading: groupsLoading } = useMaterialGroups();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.xls', '.xlsx'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Пожалуйста, выберите файл Excel (.xls или .xlsx)');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedGroupId) {
      setError('Выберите группу и файл');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('groupId', selectedGroupId.toString());

      const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/materials/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка загрузки файла');
      }

      const result: UploadResponse = await response.json();
      setParsedData(result);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке файла');
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewClose = () => {
    setParsedData(null);
    setSelectedFile(null);
    setSelectedGroupId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSuccess = () => {
    handlePreviewClose();
    onClose();
  };

  if (parsedData) {
    return (
      <MaterialPreviewModal
        data={parsedData}
        onClose={handlePreviewClose}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              <span className={styles.formIcon}>📤</span>
              Загрузка материалов из Excel
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

            {/* Выбор группы */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Группа материалов *
              </label>
              {groupsLoading ? (
                <div className={styles.groupsLoading}>
                  <div className={styles.spinner}></div>
                  <span>Загрузка групп...</span>
                </div>
              ) : groups.length === 0 ? (
                <div className={styles.noGroups}>
                  <span className={styles.noGroupsIcon}>📁</span>
                  <p>Нет доступных групп</p>
                  <p className={styles.noGroupsSubtext}>
                    Сначала создайте группу материалов
                  </p>
                </div>
              ) : (
                <select
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                  className={styles.formInput}
                  disabled={uploading}
                >
                  <option value="">Выберите группу</option>
                  {groups.map((group) => (
                    <option key={group.groupId} value={group.groupId}>
                      {group.groupName} ({group.materialsCount || 0} материалов)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Выбор файла */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Excel файл *
              </label>
              <div className={styles.fileInputWrapper}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                  disabled={uploading}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className={styles.fileInputLabel}>
                  <span className={styles.fileInputIcon}>📎</span>
                  {selectedFile ? selectedFile.name : 'Выберите файл'}
                </label>
              </div>
              <div className={styles.helpText}>
                <span className={styles.helpIcon}>💡</span>
                Файл должен содержать колонки: "Код" (или "Артикул") и "Наименование"
              </div>
            </div>

            {/* Пример формата */}
            <div className={styles.exampleSection}>
              <div className={styles.exampleTitle}>
                <span className={styles.exampleIcon}>📋</span>
                Пример формата файла:
              </div>
              <div className={styles.exampleTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Код</th>
                      <th>Наименование</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>11111</td>
                      <td>ЛДСП Белая 16мм (2800x2070) 0101 PE</td>
                    </tr>
                    <tr>
                      <td>22222</td>
                      <td>ЛДСП Дуб Белый Craft 16мм</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || !selectedGroupId || uploading}
                className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonLarge}`}
              >
                {uploading ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    Загружаем...
                  </>
                ) : (
                  <>
                    <span className={styles.buttonIcon}>📤</span>
                    Загрузить файл
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
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

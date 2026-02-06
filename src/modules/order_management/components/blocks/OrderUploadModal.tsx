import React, { useState, useRef } from 'react';
import { OrderPreviewModal } from './OrderPreviewModal';
import styles from './OrderUploadModal.module.css';

interface OrderUploadModalProps {
  onClose: () => void;
}

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

export const OrderUploadModal: React.FC<OrderUploadModalProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [parsedData, setParsedData] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!selectedFile) {
      setError('Выберите файл');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/order-management/upload`, {
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
      <OrderPreviewModal
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
              Загрузка заказа из Excel
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
                Файл должен содержать колонки: "Код" (или "Артикул"), "Наименование" и "Количество"
              </div>
            </div>

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
                      <th>Количество</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>PKG001</td>
                      <td>Упаковка стандартная 1200x800</td>
                      <td>10</td>
                    </tr>
                    <tr>
                      <td>PKG002</td>
                      <td>Упаковка усиленная 1500x1000</td>
                      <td>5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
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

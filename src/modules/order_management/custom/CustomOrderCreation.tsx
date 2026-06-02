import React, { useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import styles from './CustomOrderCreation.module.css';
import { CustomOrderPreviewModal } from './CustomOrderPreviewModal';
import { uploadCustomOrderFile, Part } from '../../api/custom/order-management/customOrderManagementApi';

interface Props {
  onBack?: () => void;
}

interface CustomOrderFormData {
  batchNumber: string;
  orderName: string;
  requiredDate: string;
}

const CustomOrderCreation: React.FC<Props> = ({ onBack }) => {
  const [formData, setFormData] = useState<CustomOrderFormData>({
    batchNumber: '',
    orderName: '',
    requiredDate: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parsedParts, setParsedParts] = useState<Part[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('Пожалуйста, загрузите файл Excel (.xlsx или .xls)');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== CUSTOM ORDER SUBMIT STARTED ===');
    console.log('Form data:', formData);
    console.log('Selected file:', selectedFile);
    
    if (!formData.batchNumber.trim()) {
      setError('Введите номер производственной партии');
      return;
    }
    
    if (!formData.orderName.trim()) {
      setError('Введите название заказа');
      return;
    }
    
    if (!formData.requiredDate) {
      setError('Выберите дату готовности');
      return;
    }
    
    if (!selectedFile) {
      setError('Загрузите файл Excel с составом заказа');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Используем API для индивидуального производства
      const result = await uploadCustomOrderFile(selectedFile);
      
      console.log('Upload result:', result);
      console.log('Form data to pass to preview:', {
        orderNumber: formData.batchNumber,
        orderName: formData.orderName,
        requiredDate: formData.requiredDate,
      });
      
      if (result.success && result.data.parts) {
        console.log('Parts received:', result.data.parts);
        console.log('Total parts count:', result.data.parts.length);
        setParsedParts(result.data.parts);
        setIsPreviewOpen(true);
        console.log('Preview modal opened with form data');
      } else {
        console.error('Upload failed:', result.message);
        setError(result.message || 'Ошибка при парсинге файла');
      }
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
  };

  const handleSuccess = () => {
    // После успешного создания заказа
    setIsPreviewOpen(false);
    setParsedParts([]);
    setSelectedFile(null);
    setFormData({
      batchNumber: '',
      orderName: '',
      requiredDate: ''
    });
    setSuccess('Заказ индивидуального производства успешно создан!');
    
    const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className={styles.container}>
      {onBack && (
        <button onClick={onBack} className={styles.backButton}>
          ← Назад
        </button>
      )}

      <h2 className={styles.title}>
        <span className={styles.icon}>⚙️</span>
        Создание заказа индивидуального производства
      </h2>

      <Alert severity="info" className={styles.infoAlert}>
        <strong>Индивидуальное производство</strong> - создание заказов с уникальными требованиями. Загрузите Excel файл с составом заказа.
      </Alert>

      {error && (
        <Alert severity="error" className={styles.alert} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" className={styles.alert} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              📦 Номер производственной партии *
            </label>
            <input
              type="text"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              placeholder="Введите номер партии"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              📋 Название заказа *
            </label>
            <input
              type="text"
              value={formData.orderName}
              onChange={(e) => setFormData({ ...formData, orderName: e.target.value })}
              placeholder="Введите название заказа"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              📅 Требуемая дата готовности *
            </label>
            <input
              type="date"
              value={formData.requiredDate}
              onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
              className={styles.input}
              required
            />
          </div>
        </div>

        <div className={styles.fileSection}>
          <label className={styles.label}>
            ☁️ Загрузить состав заказа (Excel) *
          </label>
          
          {!selectedFile ? (
            <label htmlFor="excel-file-input" className={styles.fileUpload}>
              <CloudUpload className={styles.uploadIcon} />
              <span className={styles.uploadText}>Нажмите для выбора файла</span>
              <span className={styles.uploadHint}>Поддерживаются: .xlsx, .xls</span>
              <input
                id="excel-file-input"
                type="file"
                accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </label>
          ) : (
            <div className={styles.filePreview}>
              <div className={styles.fileInfo}>
                <span className={styles.fileIcon}>📄</span>
                <div>
                  <div className={styles.fileName}>{selectedFile.name}</div>
                  <div className={styles.fileSize}>
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className={styles.removeButton}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className={styles.submitButton}
        >
          {isUploading ? (
            <>
              <CircularProgress size={18} color="inherit" />
              <span>Загрузка и парсинг...</span>
            </>
          ) : (
            <>
              <span>📤</span>
              <span>Загрузить и проверить</span>
            </>
          )}
        </button>
      </form>

      <CustomOrderPreviewModal
        open={isPreviewOpen}
        onClose={handlePreviewClose}
        parts={parsedParts}
        formData={{
          orderNumber: formData.batchNumber,
          orderName: formData.orderName,
          requiredDate: formData.requiredDate,
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default CustomOrderCreation;

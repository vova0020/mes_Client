import React, { useState, useRef } from 'react';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import styles from './UploadModal.module.css';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, quantity?: number) => Promise<void>;
  isLoading?: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isLoading = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError('');
    
    // Проверяем тип файла
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Поддерживаются только файлы Excel (.xls, .xlsx)');
      return;
    }

    // Проверяем размер файла (максимум 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Размер файла не должен превышать 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await onUpload(selectedFile, quantity);
      setSelectedFile(null);
      setQuantity(1);
      setError('');
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      setError('Ошибка при загрузке файла. Попробуйте еще раз.');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedFile(null);
      setQuantity(1);
      setError('');
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Загрузить Excel файл</h2>
          <button onClick={handleClose} className={styles.closeButton} disabled={isLoading}>
            <XMarkIcon className={styles.icon} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.info}>
            <p>Загрузите Excel файл (.xls или .xlsx) с данными деталей для парсинга.</p>
            <ul>
              <li>Максимальный размер файла: 10MB</li>
              <li>Поддерживаемые форматы: .xls, .xlsx</li>
              <li>Заголовки должны быть на русском языке</li>
            </ul>
          </div>

          {/* <div className={styles.quantityField}>
            <label htmlFor="quantity" className={styles.quantityLabel}>
              Количество деталей в упаковке:
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className={styles.quantityInput}
              disabled={isLoading}
            />
          </div> */}

          <div
            className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''} ${selectedFile ? styles.hasFile : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileInputChange}
              className={styles.hiddenInput}
              disabled={isLoading}
            />

            {selectedFile ? (
              <div className={styles.fileInfo}>
                <DocumentIcon className={styles.fileIcon} />
                <div className={styles.fileDetails}>
                  <span className={styles.fileName}>{selectedFile.name}</span>
                  <span className={styles.fileSize}>{formatFileSize(selectedFile.size)}</span>
                </div>
                <CheckIcon className={styles.checkIcon} />
              </div>
            ) : (
              <div className={styles.dropContent}>
                <CloudArrowUpIcon className={styles.uploadIcon} />
                <p className={styles.dropText}>
                  Перетащите файл сюда или <span className={styles.clickText}>нажмите для выбора</span>
                </p>
                <p className={styles.dropSubtext}>Excel файлы (.xls, .xlsx) до 10MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className={styles.error}>
              <ExclamationTriangleIcon className={styles.errorIcon} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleUpload}
            className={styles.uploadButton}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Загрузка...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className={styles.icon} />
                Загрузить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
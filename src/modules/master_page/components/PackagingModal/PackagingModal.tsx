// src/modules/master_page/components/PackagingModal/PackagingModal.tsx
import React, { useEffect, useRef } from 'react';
import styles from './PackagingModal.module.css';
import usePackaging from '../../../hooks/masterPage/usePackagingMaster';
import { PackagingDataDto } from '../../../api/masterPage/ypakServiceMaster';

interface PackagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  orderName?: string;
}

const PackagingModal: React.FC<PackagingModalProps> = ({ 
  isOpen, 
  onClose, 
  orderId, 
  orderName 
}) => {
  const { packagingData, loading, error, fetchPackaging, clearPackaging } = usePackaging();
  const modalRef = useRef<HTMLDivElement>(null);

  // Загружаем данные при открытии модального окна
  useEffect(() => {
    if (isOpen && orderId) {
      fetchPackaging(orderId);
    } else if (!isOpen) {
      clearPackaging();
    }
  }, [isOpen, orderId, fetchPackaging, clearPackaging]);

  // Закрытие модального окна при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Блокируем прокрутку фона
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset'; // Восстанавливаем прокрутку
    };
  }, [isOpen, onClose]);

  // Закрытие по клавише Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const renderPackagingTable = () => (
    <div className={styles.tableContainer}>
      <table className={styles.packagingTable}>
        <thead>
          <tr className={styles.tableHeader}>
            <th className={styles.tableHeaderCell}>Артикул упаковки</th>
            <th className={styles.tableHeaderCell}>Название упаковки</th>
            <th className={styles.tableHeaderCell}>Количество</th>
          </tr>
        </thead>
        <tbody>
          {packagingData.map((item, index) => (
            <tr
              key={item.id}
              className={`${styles.tableRow} ${styles.animatedItem}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <td className={styles.tableCell}>{item.packageCode}</td>
              <td className={styles.tableCell}>{item.packageName}</td>
              <td className={styles.tableCell}>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            СОСТАВ ЗАКАЗА {orderName ? `- ${orderName}` : ''}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className={styles.modalContent}>
          {loading ? (
            <div className={styles.stateContainer}>
              <div className={styles.loadingSpinner}></div>
              <div className={styles.loadingMessage}>
                <h3>Загрузка упаковок</h3>
                <p>Пожалуйста, подождите...</p>
              </div>
            </div>
          ) : error ? (
            <div className={styles.stateContainer}>
              <div className={styles.errorIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
              </div>
              <div className={styles.errorMessage}>
                <h3>Не удалось загрузить упаковки</h3>
                <p>Произошла ошибка при получении данных с сервера</p>
                <button 
                  onClick={() => fetchPackaging(orderId)} 
                  className={styles.retryButton}
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          ) : packagingData.length === 0 ? (
            <div className={styles.stateContainer}>
              <div className={styles.emptyIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className={styles.emptyMessage}>
                <h3>Нет упаковок для данного заказа</h3>
                <p>В данный момент список упаковок пуст</p>
              </div>
            </div>
          ) : (
            renderPackagingTable()
          )}
        </div>
      </div>
    </div>
  );
};

export default PackagingModal;
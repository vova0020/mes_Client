import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import styles from './ProductSection.module.css';

interface Product {
  id: string;
  seriesId: string;
  name: string;
  isExpanded: boolean;
}

interface ProductSectionProps {
  products: Product[];
  selectedSeriesId: string | null;
  onAddProduct: (seriesId: string, name: string) => void;
  onToggleProduct: (productId: string) => void;
  selectedProductId: string | null;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  selectedSeriesId,
  onAddProduct,
  onToggleProduct,
  selectedProductId
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProductName, setNewProductName] = useState('');

  const handleAddProduct = () => {
    if (newProductName.trim() && selectedSeriesId) {
      onAddProduct(selectedSeriesId, newProductName.trim());
      setNewProductName('');
      setIsAddingNew(false);
    }
  };

  const handleCancel = () => {
    setNewProductName('');
    setIsAddingNew(false);
  };

  const canAddProduct = selectedSeriesId !== null;

  return (
    <div className={styles['product-section']}>
      <div className={styles['section-header']}>
        <h3>Изделия</h3>
        <button
          className={`${styles.btn} ${styles['btn--primary']} ${styles['btn--small']}`}
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew || !canAddProduct}
          title={!canAddProduct ? 'Выберите серию для добавления изделия' : ''}
        >
          <PlusIcon className={styles.icon} />
          Добавить изделие
        </button>
      </div>

      <div className={styles['section-content']}>
        {!selectedSeriesId && (
          <div className={styles['empty-state']}>
            <p>Выберите серию</p>
            <p className={styles['empty-state__hint']}>Для просмотра изделий выберите серию из левого блока</p>
          </div>
        )}

        {selectedSeriesId && (
          <>
            {/* Форма добавления нового изделия */}
            {isAddingNew && (
              <div className={styles['add-form']}>
                <input
                  type="text"
                  placeholder="Название изделия"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className={styles['form-input']}
                  autoFocus
                />
                <div className={styles['add-form__actions']}>
                  <button
                    className={`${styles.btn} ${styles['btn--primary']} ${styles['btn--small']}`}
                    onClick={handleAddProduct}
                  >
                    Сохранить
                  </button>
                  <button
                    className={`${styles.btn} ${styles['btn--secondary']} ${styles['btn--small']}`}
                    onClick={handleCancel}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Список изделий */}
            <div className={styles['product-list']}>
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`${styles['product-item']} ${
                    selectedProductId === product.id ? styles['product-item--selected'] : ''
                  }`}
                >
                  <button
                    className={styles['product-item__toggle']}
                    onClick={() => onToggleProduct(product.id)}
                  >
                    {product.isExpanded ? (
                      <ChevronDownIcon className={styles.icon} />
                    ) : (
                      <ChevronRightIcon className={styles.icon} />
                    )}
                    <span className={styles['product-item__name']}>{product.name}</span>
                  </button>
                </div>
              ))}
            </div>

            {products.length === 0 && !isAddingNew && (
              <div className={styles['empty-state']}>
                <p>Нет изделий в выбранной серии</p>
                <p className={styles['empty-state__hint']}>Добавьте первое изделие</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
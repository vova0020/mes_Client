import React, { useState } from 'react';
import { SeriesSection } from './blocks/SeriesSection';
import { ProductSection } from './blocks/ProductSection';
import { PackagingSection } from './blocks/PackagingSection';
import { DetailsSection } from './blocks/DetailsSection';
import styles from './DetailsReferenceContainer.module.css';

interface Series {
  id: string;
  name: string;
  isExpanded: boolean;
}

interface Product {
  id: string;
  seriesId: string;
  name: string;
  isExpanded: boolean;
}

interface Packaging {
  id: string;
  productId: string;
  article: string;
  name: string;
  detailsCount: number;
}

export const DetailsReferenceContainer: React.FC = () => {
  // Состояние для всех данных
  const [series, setSeries] = useState<Series[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  
  // Состояние для выбранных элементов
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedPackagingId, setSelectedPackagingId] = useState<string | null>(null);

  // Обработчики для серий
  const handleAddSeries = (name: string) => {
    const newSeries: Series = {
      id: `series_${Date.now()}`,
      name,
      isExpanded: false
    };
    setSeries(prev => [...prev, newSeries]);
  };

  const handleToggleSeries = (seriesId: string) => {
    setSeries(prev => 
      prev.map(s => 
        s.id === seriesId ? { ...s, isExpanded: !s.isExpanded } : s
      )
    );
    
    // При выборе новой серии сбрасываем выбранные изделие и упаковку
    if (selectedSeriesId !== seriesId) {
      setSelectedSeriesId(seriesId);
      setSelectedProductId(null);
      setSelectedPackagingId(null);
    }
  };

  // Обработчики для изделий
  const handleAddProduct = (seriesId: string, name: string) => {
    const newProduct: Product = {
      id: `product_${Date.now()}`,
      seriesId,
      name,
      isExpanded: false
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const handleToggleProduct = (productId: string) => {
    setProducts(prev => 
      prev.map(p => 
        p.id === productId ? { ...p, isExpanded: !p.isExpanded } : p
      )
    );
    
    // При выборе нового изделия сбрасываем выбранную упаковку
    if (selectedProductId !== productId) {
      setSelectedProductId(productId);
      setSelectedPackagingId(null);
    }
  };

  // Обработчики для упаковок
  const handleAddPackaging = (productId: string, article: string, name: string) => {
    const newPackaging: Packaging = {
      id: `packaging_${Date.now()}`,
      productId,
      article,
      name,
      detailsCount: 0
    };
    setPackaging(prev => [...prev, newPackaging]);
  };

  // Фильтрация данных для отображения
  const selectedProducts = products.filter(p => p.seriesId === selectedSeriesId);
  const selectedPackaging = packaging.filter(p => p.productId === selectedProductId);

  // Получение информации о выбранных элементах
  const selectedSeries = series.find(s => s.id === selectedSeriesId);
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedPackagingItem = packaging.find(p => p.id === selectedPackagingId);

  return (
    <div className={styles['details-reference-container']}>
      {/* Верхняя часть - Иерархия */}
      <div className={styles['details-reference-container__hierarchy']}>
        <div className={styles['hierarchy__sections']}>
          {/* Секция серий */}
          <div className={styles['hierarchy__section']}>
            <SeriesSection
              series={series}
              onAddSeries={handleAddSeries}
              onToggleSeries={handleToggleSeries}
              selectedSeriesId={selectedSeriesId}
            />
          </div>

          {/* Секция изделий */}
          <div className={styles['hierarchy__section']}>
            <ProductSection
              products={selectedProducts}
              selectedSeriesId={selectedSeriesId}
              onAddProduct={handleAddProduct}
              onToggleProduct={handleToggleProduct}
              selectedProductId={selectedProductId}
            />
          </div>

          {/* Секция упаковок */}
          <div className={styles['hierarchy__section']}>
            <PackagingSection
              packaging={selectedPackaging}
              selectedProductId={selectedProductId}
              onAddPackaging={handleAddPackaging}
            />
          </div>
        </div>
      </div>

      {/* Нижняя часть - Детали */}
      <div className={styles['details-reference-container__details']}>
        <DetailsSection />
      </div>

      {/* Информационная панель */}
      <div className={styles['details-reference-container__info']}>
        <div className={styles.breadcrumb}>
          {selectedSeries && (
            <span className={styles['breadcrumb__item']}>
              <span className={styles['breadcrumb__label']}>Серия:</span>
              <span className={styles['breadcrumb__value']}>{selectedSeries.name}</span>
            </span>
          )}
          {selectedProduct && (
            <>
              <span className={styles['breadcrumb__separator']}>→</span>
              <span className={styles['breadcrumb__item']}>
                <span className={styles['breadcrumb__label']}>Изделие:</span>
                <span className={styles['breadcrumb__value']}>{selectedProduct.name}</span>
              </span>
            </>
          )}
          {selectedPackagingItem && (
            <>
              <span className={styles['breadcrumb__separator']}>→</span>
              <span className={styles['breadcrumb__item']}>
                <span className={styles['breadcrumb__label']}>Упаковка:</span>
                <span className={styles['breadcrumb__value']}>{selectedPackagingItem.name}</span>
              </span>
            </>
          )}
        </div>
        
        {/* Статистика */}
        <div className={styles.stats}>
          <div className={styles['stats__item']}>
            <span className={styles['stats__label']}>Серий:</span>
            <span className={styles['stats__value']}>{series.length}</span>
          </div>
          <div className={styles['stats__item']}>
            <span className={styles['stats__label']}>Изделий:</span>
            <span className={styles['stats__value']}>{products.length}</span>
          </div>
          <div className={styles['stats__item']}>
            <span className={styles['stats__label']}>Упаковок:</span>
            <span className={styles['stats__value']}>{packaging.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
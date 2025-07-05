import React, { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import styles from './DetailsSection.module.css';

interface Detail {
  id: number;
  packageId: string;
  partSku: string;
  partName: string;
  materialName: string;
  materialSku: string;
  thickness?: number;
  thicknessWithEdging?: number;
  finishedLength?: number;
  finishedWidth?: number;
  groove?: string;
  edgingSkuL1?: string;
  edgingNameL1?: string;
  edgingSkuL2?: string;
  edgingNameL2?: string;
  edgingSkuW1?: string;
  edgingNameW1?: string;
  edgingSkuW2?: string;
  edgingNameW2?: string;
  plasticFace?: string;
  plasticFaceSku?: string;
  plasticBack?: string;
  plasticBackSku?: string;
  pf?: boolean;
  pfSku?: string;
  sbPart?: boolean;
  pfSb?: boolean;
  sbPartSku?: string;
  quantity: number;
}

interface DetailsSectionProps {
  selectedPackagingId?: string | null;
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({
  selectedPackagingId
}) => {
  const [details, setDetails] = useState<Detail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all'|'metal'|'plastic'|'steel'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка деталей при смене selectedPackagingId
  useEffect(() => {
    if (!selectedPackagingId) {
      setDetails([]);
      return;
    }

    setIsLoading(true);
    
    // Имитация загрузки данных - замените на реальный API вызов
    const fetchMockDetails = async () => {
      // Симуляция задержки сети
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockDetails: Detail[] = [
        {
          id: 1,
          packageId: selectedPackagingId,
          partSku: 'KRP-001',
          partName: 'Корпус основной',
          materialName: 'Алюминий',
          materialSku: 'AL-100',
          thickness: 5,
          thicknessWithEdging: 5.5,
          finishedLength: 150,
          finishedWidth: 100,
          groove: 'T',
          edgingSkuL1: 'EDG-01',
          edgingNameL1: 'Кромка L1',
          edgingSkuL2: undefined,
          edgingNameL2: undefined,
          edgingSkuW1: undefined,
          edgingNameW1: undefined,
          edgingSkuW2: undefined,
          edgingNameW2: undefined,
          plasticFace: 'ABS',
          plasticFaceSku: 'PL-ABS',
          plasticBack: 'PP',
          plasticBackSku: 'PL-PP',
          pf: true,
          pfSku: 'PF-001',
          sbPart: false,
          pfSb: false,
          sbPartSku: undefined,
          quantity: 1
        },
        {
          id: 2,
          packageId: selectedPackagingId,
          partSku: 'VNT-003',
          partName: 'Винт крепежный',
          materialName: 'Сталь',
          materialSku: 'ST-200',
          thickness: undefined,
          thicknessWithEdging: undefined,
          finishedLength: undefined,
          finishedWidth: undefined,
          groove: undefined,
          edgingSkuL1: undefined,
          edgingNameL1: undefined,
          edgingSkuL2: undefined,
          edgingNameL2: undefined,
          edgingSkuW1: undefined,
          edgingNameW1: undefined,
          edgingSkuW2: undefined,
          edgingNameW2: undefined,
          plasticFace: undefined,
          plasticFaceSku: undefined,
          plasticBack: undefined,
          plasticBackSku: undefined,
          pf: false,
          pfSku: undefined,
          sbPart: true,
          pfSb: true,
          sbPartSku: 'SB-003',
          quantity: 4
        },
        {
          id: 3,
          packageId: selectedPackagingId,
          partSku: 'PLT-005',
          partName: 'Пластина боковая',
          materialName: 'Пластик',
          materialSku: 'PL-300',
          thickness: 3,
          thicknessWithEdging: 3.2,
          finishedLength: 80,
          finishedWidth: 60,
          groove: undefined,
          edgingSkuL1: 'EDG-02',
          edgingNameL1: 'Кромка пластиковая',
          edgingSkuL2: undefined,
          edgingNameL2: undefined,
          edgingSkuW1: 'EDG-02',
          edgingNameW1: 'Кромка пластиковая',
          edgingSkuW2: undefined,
          edgingNameW2: undefined,
          plasticFace: 'ABS',
          plasticFaceSku: 'PL-ABS-W',
          plasticBack: undefined,
          plasticBackSku: undefined,
          pf: false,
          pfSku: undefined,
          sbPart: false,
          pfSb: false,
          sbPartSku: undefined,
          quantity: 2
        }
      ];
      
      setDetails(mockDetails);
      setIsLoading(false);
    };

    fetchMockDetails();
  }, [selectedPackagingId]);

  // Фильтрация по поиску и материалу
  const filtered = useMemo(() => {
    return details.filter(d => {
      const text = `${d.partName} ${d.partSku}`.toLowerCase();
      const okSearch = text.includes(searchTerm.toLowerCase());
      const okFilter =
        filterType === 'all'
        || (filterType === 'metal' && /алюминий|сталь/.test(d.materialName.toLowerCase()))
        || (filterType === 'plastic' && /пластик/.test(d.materialName.toLowerCase()))
        || (filterType === 'steel' && /сталь/.test(d.materialName.toLowerCase()));
      return okSearch && okFilter;
    });
  }, [details, searchTerm, filterType]);

  const handleAddDetail = () => {
    console.log('Добавить новую деталь для упаковки:', selectedPackagingId);
    // Здесь будет логика добавления новой детали
  };

  const handleCopyDetail = (detailId: number) => {
    console.log('Копировать деталь:', detailId);
    // Здесь будет логика копирования детали
  };

  const handleViewDetailSchema = (detailId: number) => {
    console.log('Прос��отр схемы детали:', detailId);
    // Здесь будет логика просмотра схемы детали
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Детали упаковки</h2>
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <MagnifyingGlassIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Поиск по артикулу или названию..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              disabled={!selectedPackagingId || isLoading}
            />
          </div>
          <select
            className={styles.select}
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            disabled={!selectedPackagingId || isLoading}
          >
            <option value="all">Все материалы</option>
            <option value="metal">Металл</option>
            <option value="plastic">Пластик</option>
            <option value="steel">Сталь</option>
          </select>
          <div className={styles.count}>
            <FunnelIcon className={styles.filterIcon} />
            Найдено: <span className={styles.countNumber}>{filtered.length}</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        {!selectedPackagingId ? (
          <div className={styles.emptyState}>
            <h3>Выберите упаковку</h3>
            <p>Выберите упаковку из списка выше, чтобы увидеть её детали</p>
          </div>
        ) : isLoading ? (
          <div className={styles.loadingState}>
            <p>Загрузка деталей...</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Артикул</th>
                <th>Наименование</th>
                <th>Материал</th>
                <th>Толщина</th>
                <th>Толщина+кромка</th>
                <th>L×W (мм)</th>
                <th>Паз</th>
                <th>Кромка L1</th>
                <th>Кромка L2</th>
                <th>Кромка W1</th>
                <th>Кромка W2</th>
                <th>Пластик лиц.</th>
                <th>Пластик обл.</th>
                <th>PF</th>
                <th>SB</th>
                <th>Кол-во</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={17} className={styles.empty}>
                    {details.length === 0 ? 'В этой упаковке пока нет деталей' : 'Детали не найдены по заданным критериям'}
                  </td>
                </tr>
              )}
              {filtered.map(d => (
                <tr key={d.id}>
                  <td><span className={styles.skuBadge}>{d.partSku}</span></td>
                  <td className={styles.nameCell}>{d.partName}</td>
                  <td>{d.materialName} <span className={styles.materialSku}>({d.materialSku})</span></td>
                  <td>{d.thickness ?? '–'}</td>
                  <td>{d.thicknessWithEdging ?? '–'}</td>
                  <td>{d.finishedLength && d.finishedWidth ? `${d.finishedLength}×${d.finishedWidth}` : '–'}</td>
                  <td>{d.groove || '–'}</td>
                  <td>{d.edgingSkuL1 || '–'}</td>
                  <td>{d.edgingSkuL2 || '–'}</td>
                  <td>{d.edgingSkuW1 || '–'}</td>
                  <td>{d.edgingSkuW2 || '–'}</td>
                  <td>{d.plasticFace || '–'}</td>
                  <td>{d.plasticBack || '–'}</td>
                  <td><span className={`${styles.badge} ${d.pf ? styles.badgeYes : styles.badgeNo}`}>{d.pf ? 'Да' : 'Нет'}</span></td>
                  <td><span className={`${styles.badge} ${d.sbPart ? styles.badgeYes : styles.badgeNo}`}>{d.sbPart ? 'Да' : 'Нет'}</span></td>
                  <td><span className={styles.quantityBadge}>{d.quantity}</span></td>
                  <td className={styles.actions}>
                    <button 
                      onClick={() => handleCopyDetail(d.id)}
                      title="Копировать деталь"
                      className={styles.actionButton}
                    >
                      <DocumentDuplicateIcon className={styles.icon} />
                    </button>
                    <button 
                      onClick={() => handleViewDetailSchema(d.id)}
                      title="Схема детали"
                      className={styles.actionButton}
                    >
                      <MapIcon className={styles.icon} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedPackagingId && !isLoading && (
        <button className={styles.addBtn} onClick={handleAddDetail}>
          <PlusIcon className={styles.icon} />
          Добавить деталь
        </button>
      )}
    </div>
  );
};
import React, { useState, useMemo, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  MapIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { useDetails } from '../../../../../../hooks/detailsHook';
import { useParser } from '../../../../../../hooks/parserHook';
import { Detail, CreateDetailDto, UpdateDetailDto, CreateDetailWithPackageDto } from '../../../../../../api/detailsApi/detailsApi';
import { ParsedDetail } from '../../../../../../api/parserApi/parserApi';
import { DetailModal, DeleteConfirmModal, UploadModal, ParsedDataModal } from '../modals';
import styles from './DetailsSection.module.css';

interface DetailsSectionProps {
  selectedPackagingId?: string | null;
}

type ViewMode = 'table' | 'cards';
type SortField = 'partSku' | 'partName' | 'materialName' | 'thickness' | 'quantity';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  material: string;
  thickness: string;
  pf: string;
  sbPart: string;
  minQuantity: string;
  maxQuantity: string;
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({
  selectedPackagingId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('partSku');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showParsedDataModal, setShowParsedDataModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Detail | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    title: '',
    message: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    material: '',
    thickness: '',
    pf: '',
    sbPart: '',
    minQuantity: '',
    maxQuantity: ''
  });

  // Преобразуем selectedPackagingId в число для API
  const packageId = selectedPackagingId ? parseInt(selectedPackagingId, 10) : undefined;
  
  // Используем хуки для работы с деталями и парсером
  const {
    details,
    loading,
    error,
    createDetail,
    createDetailWithPackage,
    updateDetail,
    deleteDetail,
    copyDetail,
    saveDetailsFromFile,
    isCreating,
    isUpdating,
    isDeleting,
    isCopying
  } = useDetails(packageId);

  const {
    uploadFile,
    parsedData,
    loading: parserLoading,
    error: parserError,
    isUploading,
    clearAfterSave
  } = useParser();

  // Определяем состояние загрузки
  const isLoading = loading === 'loading';

  // Показать уведомление
  const showNotification = (type: NotificationState['type'], title: string, message: string) => {
    setNotification({ show: true, type, title, message });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Фильтрация и сортировка
  const filteredAndSorted = useMemo(() => {
    let result = details.filter(d => {
      // Поиск по тексту
      const searchText = `${d.partName} ${d.partSku} ${d.materialName}`.toLowerCase();
      const matchesSearch = searchText.includes(searchTerm.toLowerCase());

      // Фильтры
      const matchesMaterial = !filters.material || d.materialName.toLowerCase().includes(filters.material.toLowerCase());
      const matchesThickness = !filters.thickness || (d.thickness && d.thickness.toString().includes(filters.thickness));
      const matchesPf = !filters.pf || (filters.pf === 'true' ? d.pf === true : d.pf === false);
      const matchesSbPart = !filters.sbPart || (filters.sbPart === 'true' ? d.sbPart === true : d.sbPart === false);
      
      const minQty = filters.minQuantity ? parseInt(filters.minQuantity) : 0;
      const maxQty = filters.maxQuantity ? parseInt(filters.maxQuantity) : Infinity;
      const matchesQuantity = d.quantity >= minQty && d.quantity <= maxQty;

      return matchesSearch && matchesMaterial && matchesThickness && matchesPf && matchesSbPart && matchesQuantity;
    });

    // Сортировка
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [details, searchTerm, filters, sortField, sortDirection]);

  // Обработчики
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreateDetail = async (formData: CreateDetailDto) => {
    try {
      if (packageId) {
        // Создаем деталь с привязкой к упаковке
        const createWithPackageDto: CreateDetailWithPackageDto = {
          ...formData,
          packageId: packageId,
          quantity: formData.quantity || 1
        };
        await createDetailWithPackage(createWithPackageDto);
      } else {
        // Создаем деталь без привязки к упаковке
        await createDetail(formData);
      }
      setShowCreateModal(false);
      showNotification('success', 'Успех', 'Деталь успешно создана');
    } catch (error) {
      showNotification('error', 'Ошибка', 'Не удалось создать деталь');
    }
  };

  const handleEditDetail = async (formData: UpdateDetailDto) => {
    if (!selectedDetail) return;
    try {
      await updateDetail(selectedDetail.id, formData);
      setShowEditModal(false);
      setSelectedDetail(null);
      showNotification('success', 'Успех', 'Деталь успешно обновлена');
    } catch (error) {
      showNotification('error', 'Ошибка', 'Не удалось обновить деталь');
    }
  };

  const handleDeleteDetail = async () => {
    if (!selectedDetail) return;
    try {
      await deleteDetail(selectedDetail.id);
      setShowDeleteModal(false);
      setSelectedDetail(null);
      showNotification('success', 'Успех', 'Деталь успешно удалена');
    } catch (error) {
      showNotification('error', 'Ошибка', 'Не удалось удалить деталь');
    }
  };

  const handleCopyDetail = async (detailId: number) => {
    try {
      await copyDetail(detailId);
      showNotification('success', 'Успех', 'Деталь успешно скопирована');
    } catch (error) {
      showNotification('error', 'Ошибка', 'Не удалось скопировать деталь');
    }
  };

  const handleFileUpload = async (file: File, quantity?: number) => {
    try {
      // Передаем packageId и quantity в парсер для проверки
      const response = await uploadFile(file, packageId);
      setShowUploadModal(false);
      
      // Показываем модальное окно с результатами парсинга для редактирования
      setShowParsedDataModal(true);
      showNotification('success', 'Успех', 'Файл успешно загружен и обработан. Проверьте данные перед сохранением.');
    } catch (error) {
      showNotification('error', 'Ошибка', 'Не удалось обработать файл');
    }
  };

  const handleSaveParsedData = async (editedData: ParsedDetail[]) => {
    if (!packageId) return;
    
    try {
      // Преобразуем ParsedDetail в CreateDetailDto
      const detailsToSave: CreateDetailDto[] = editedData.map(detail => ({
        partSku: detail.partSku,
        partName: detail.partName,
        materialName: detail.materialName,
        materialSku: detail.materialSku,
        thickness: detail.thickness,
        thicknessWithEdging: detail.thicknessWithEdging,
        finishedLength: detail.finishedLength,
        finishedWidth: detail.finishedWidth,
        groove: detail.groove,
        edgingSkuL1: detail.edgingSkuL1,
        edgingNameL1: detail.edgingNameL1,
        edgingSkuL2: detail.edgingSkuL2,
        edgingNameL2: detail.edgingNameL2,
        edgingSkuW1: detail.edgingSkuW1,
        edgingNameW1: detail.edgingNameW1,
        edgingSkuW2: detail.edgingSkuW2,
        edgingNameW2: detail.edgingNameW2,
        plasticFace: detail.plasticFace,
        plasticFaceSku: detail.plasticFaceSku,
        plasticBack: detail.plasticBack,
        plasticBackSku: detail.plasticBackSku,
        pf: detail.pf,
        pfSku: detail.pfSku,
        sbPart: detail.sbPart,
        pfSb: detail.pfSb,
        sbPartSku: detail.sbPartSku,
        conveyorPosition: detail.conveyorPosition,
        quantity: detail.quantity
      }));

      const result = await saveDetailsFromFile({
        packageId: packageId,
        details: detailsToSave
      });

      setShowParsedDataModal(false);
      clearAfterSave(); // Очищаем данные парсера после успешного сохранения
      showNotification('success', 'Успех', 
        `Детали сохранены: создано ${result.data.created}, обновлено ${result.data.updated}, подключено ${result.data.connected}`
      );
    } catch (error) {
      showNotification('error', 'Ошибка', 'Не удалось сохранить детали из файла');
    }
  };

  const openEditModal = (detail: Detail) => {
    setSelectedDetail(detail);
    setShowEditModal(true);
  };

  const openDeleteModal = (detail: Detail) => {
    setSelectedDetail(detail);
    setShowDeleteModal(true);
  };

  // Показываем ошибку, если она есть
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Детали упаковки</h2>
        </div>
        <div className={styles.card}>
          <div className={styles.errorState}>
            <ExclamationTriangleIcon className={styles.errorIcon} />
            <h3>Ошибка загрузки</h3>
            <p>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Уведомления */}
      {notification.show && (
        <div className={`${styles.notification} ${styles[`notification${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}`]}`}>
          <div className={styles.notificationContent}>
            <div className={styles.notificationHeader}>
              {notification.type === 'success' && <CheckIcon className={styles.notificationIcon} />}
              {notification.type === 'error' && <ExclamationTriangleIcon className={styles.notificationIcon} />}
              {notification.type === 'warning' && <ExclamationTriangleIcon className={styles.notificationIcon} />}
              {notification.type === 'info' && <InformationCircleIcon className={styles.notificationIcon} />}
              <span className={styles.notificationTitle}>{notification.title}</span>
            </div>
            <p className={styles.notificationMessage}>{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            className={styles.notificationClose}
          >
            <XMarkIcon className={styles.icon} />
          </button>
        </div>
      )}

      {/* Заголовок */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2>Детали упаковки</h2>
          <div className={styles.headerActions}>
            {selectedPackagingId && (
              <>
                <button 
                  className={styles.uploadBtn}
                  onClick={() => setShowUploadModal(true)}
                  disabled={isLoading}
                >
                  <CloudArrowUpIcon className={styles.icon} />
                  Загрузить Excel
                </button>
                <button 
                  className={styles.addBtn} 
                  onClick={() => setShowCreateModal(true)}
                  disabled={isLoading}
                >
                  <PlusIcon className={styles.icon} />
                  Добавить деталь
                </button>
              </>
            )}
          </div>
        </div>

        {selectedPackagingId && (
          <div className={styles.toolbar}>
            <div className={styles.searchWrapper}>
              <MagnifyingGlassIcon className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Поиск по артикулу, названию или материалу..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={styles.searchInput}
                disabled={isLoading}
              />
            </div>

            <div className={styles.toolbarActions}>
              <button
                className={`${styles.filterBtn} ${showFilters ? styles.active : ''}`}
                onClick={() => setShowFilters(!showFilters)}
                disabled={isLoading}
              >
                <AdjustmentsHorizontalIcon className={styles.icon} />
                Фильтры
              </button>

              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'table' ? styles.active : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  Таблица
                </button>
                <button
                  className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.active : ''}`}
                  onClick={() => setViewMode('cards')}
                >
                  Карточки
                </button>
              </div>

              <div className={styles.count}>
                <FunnelIcon className={styles.filterIcon} />
                Найдено: <span className={styles.countNumber}>{filteredAndSorted.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Расширенные фильтры */}
        {showFilters && selectedPackagingId && (
          <div className={styles.filtersPanel}>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label>Материал</label>
                <input
                  type="text"
                  placeholder="Фильтр по материалу"
                  value={filters.material}
                  onChange={e => setFilters(prev => ({ ...prev, material: e.target.value }))}
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Толщина</label>
                <input
                  type="text"
                  placeholder="Фильтр по толщине"
                  value={filters.thickness}
                  onChange={e => setFilters(prev => ({ ...prev, thickness: e.target.value }))}
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>ПФ</label>
                <select
                  value={filters.pf}
                  onChange={e => setFilters(prev => ({ ...prev, pf: e.target.value }))}
                  className={styles.filterSelect}
                >
                  <option value="">Все</option>
                  <option value="true">Да</option>
                  <option value="false">Нет</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>СБ деталь</label>
                <select
                  value={filters.sbPart}
                  onChange={e => setFilters(prev => ({ ...prev, sbPart: e.target.value }))}
                  className={styles.filterSelect}
                >
                  <option value="">Все</option>
                  <option value="true">Да</option>
                  <option value="false">Нет</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Мин. количество</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minQuantity}
                  onChange={e => setFilters(prev => ({ ...prev, minQuantity: e.target.value }))}
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Макс. количество</label>
                <input
                  type="number"
                  placeholder="∞"
                  value={filters.maxQuantity}
                  onChange={e => setFilters(prev => ({ ...prev, maxQuantity: e.target.value }))}
                  className={styles.filterInput}
                />
              </div>
            </div>
            <button
              className={styles.clearFiltersBtn}
              onClick={() => setFilters({
                material: '',
                thickness: '',
                pf: '',
                sbPart: '',
                minQuantity: '',
                maxQuantity: ''
              })}
            >
              Очистить фильтры
            </button>
          </div>
        )}
      </div>

      {/* Основной контент */}
      <div className={styles.card}>
        {!selectedPackagingId ? (
          <div className={styles.emptyState}>
            <DocumentArrowUpIcon className={styles.emptyIcon} />
            <h3>Выберите упаковку</h3>
            <p>Выберите упаковку из списка выше, чтобы увидеть её детали</p>
          </div>
        ) : isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Загрузка деталей...</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('partSku')} className={styles.sortable}>
                    Артикул детали
                    {sortField === 'partSku' && (
                      <ChevronDownIcon className={`${styles.sortIcon} ${sortDirection === 'desc' ? styles.rotated : ''}`} />
                    )}
                  </th>
                  <th onClick={() => handleSort('partName')} className={styles.sortable}>
                    Наименование детали
                    {sortField === 'partName' && (
                      <ChevronDownIcon className={`${styles.sortIcon} ${sortDirection === 'desc' ? styles.rotated : ''}`} />
                    )}
                  </th>
                  <th onClick={() => handleSort('materialName')} className={styles.sortable}>
                    Наименование материала
                    {sortField === 'materialName' && (
                      <ChevronDownIcon className={`${styles.sortIcon} ${sortDirection === 'desc' ? styles.rotated : ''}`} />
                    )}
                  </th>
                  <th>Артикул материала</th>
                  <th onClick={() => handleSort('thickness')} className={styles.sortable}>
                    Толщина детали
                    {sortField === 'thickness' && (
                      <ChevronDownIcon className={`${styles.sortIcon} ${sortDirection === 'desc' ? styles.rotated : ''}`} />
                    )}
                  </th>
                  <th>Толщина с облицовкой</th>
                  <th>Готовая деталь [L]</th>
                  <th>Готовая деталь [W]</th>
                  <th>Паз</th>
                  <th>Облицовка L1</th>
                  <th>Облицовка L2</th>
                  <th>Облицовка W1</th>
                  <th>Облицовка W2</th>
                  <th>Пластик (лицевая)</th>
                  <th>Пластик (нелицевая)</th>
                  <th>ПФ</th>
                  <th>Артикул ПФ</th>
                  <th>СБ деталь</th>
                  <th>ПФ СБ</th>
                  <th>Артикул СБ детали</th>
                  <th>Подстопное место</th>
                  <th onClick={() => handleSort('quantity')} className={styles.sortable}>
                    Количество
                    {sortField === 'quantity' && (
                      <ChevronDownIcon className={`${styles.sortIcon} ${sortDirection === 'desc' ? styles.rotated : ''}`} />
                    )}
                  </th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={23} className={styles.empty}>
                      {details.length === 0 ? 'В этой упаковке пока нет деталей' : 'Детали не найдены по заданным критериям'}
                    </td>
                  </tr>
                )}
                {filteredAndSorted.map(d => (
                  <tr key={d.id} className={styles.tableRow}>
                    <td><span className={styles.skuBadge}>{d.partSku}</span></td>
                    <td className={styles.nameCell}>{d.partName}</td>
                    <td>{d.materialName}</td>
                    <td><span className={styles.materialSku}>{d.materialSku}</span></td>
                    <td>{d.thickness ?? '–'}</td>
                    <td>{d.thicknessWithEdging ?? '–'}</td>
                    <td>{d.finishedLength ?? '–'}</td>
                    <td>{d.finishedWidth ?? '–'}</td>
                    <td>{d.groove ?? '–'}</td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {d.edgingSkuL1 && <span className={styles.edgingSku}>{d.edgingSkuL1}</span>}
                        {d.edgingNameL1 && <span className={styles.edgingName}>{d.edgingNameL1}</span>}
                        {!d.edgingSkuL1 && !d.edgingNameL1 && '–'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {d.edgingSkuL2 && <span className={styles.edgingSku}>{d.edgingSkuL2}</span>}
                        {d.edgingNameL2 && <span className={styles.edgingName}>{d.edgingNameL2}</span>}
                        {!d.edgingSkuL2 && !d.edgingNameL2 && '–'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {d.edgingSkuW1 && <span className={styles.edgingSku}>{d.edgingSkuW1}</span>}
                        {d.edgingNameW1 && <span className={styles.edgingName}>{d.edgingNameW1}</span>}
                        {!d.edgingSkuW1 && !d.edgingNameW1 && '–'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.edgingInfo}>
                        {d.edgingSkuW2 && <span className={styles.edgingSku}>{d.edgingSkuW2}</span>}
                        {d.edgingNameW2 && <span className={styles.edgingName}>{d.edgingNameW2}</span>}
                        {!d.edgingSkuW2 && !d.edgingNameW2 && '–'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.plasticInfo}>
                        {d.plasticFace && <span className={styles.plasticName}>{d.plasticFace}</span>}
                        {d.plasticFaceSku && <span className={styles.plasticSku}>{d.plasticFaceSku}</span>}
                        {!d.plasticFace && !d.plasticFaceSku && '–'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.plasticInfo}>
                        {d.plasticBack && <span className={styles.plasticName}>{d.plasticBack}</span>}
                        {d.plasticBackSku && <span className={styles.plasticSku}>{d.plasticBackSku}</span>}
                        {!d.plasticBack && !d.plasticBackSku && '–'}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${d.pf ? styles.badgeYes : styles.badgeNo}`}>
                        {d.pf ? 'Да' : 'Нет'}
                      </span>
                    </td>
                    <td>{d.pfSku ?? '–'}</td>
                    <td>
                      <span className={`${styles.badge} ${d.sbPart ? styles.badgeYes : styles.badgeNo}`}>
                        {d.sbPart ? 'Да' : 'Нет'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${d.pfSb ? styles.badgeYes : styles.badgeNo}`}>
                        {d.pfSb ? 'Да' : 'Нет'}
                      </span>
                    </td>
                    <td>{d.sbPartSku ?? '–'}</td>
                    <td>{d.conveyorPosition ?? '–'}</td>
                    <td><span className={styles.quantityBadge}>{d.quantity}</span></td>
                    <td className={styles.actions}>
                      <button 
                        onClick={() => openEditModal(d)}
                        title="Редактировать"
                        className={styles.actionButton}
                        disabled={isUpdating}
                      >
                        <PencilIcon className={styles.icon} />
                      </button>
                      <button 
                        onClick={() => handleCopyDetail(d.id)}
                        title="Копировать"
                        className={styles.actionButton}
                        disabled={isCopying}
                      >
                        <DocumentDuplicateIcon className={styles.icon} />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(d)}
                        title="Удалить"
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        disabled={isDeleting}
                      >
                        <TrashIcon className={styles.icon} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {filteredAndSorted.map(d => (
              <div key={d.id} className={styles.detailCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.skuBadge}>{d.partSku}</span>
                  <div className={styles.cardActions}>
                    <button 
                      onClick={() => openEditModal(d)}
                      title="Редактировать"
                      className={styles.actionButton}
                    >
                      <PencilIcon className={styles.icon} />
                    </button>
                    <button 
                      onClick={() => handleCopyDetail(d.id)}
                      title="Копировать"
                      className={styles.actionButton}
                    >
                      <DocumentDuplicateIcon className={styles.icon} />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(d)}
                      title="Удалить"
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                    >
                      <TrashIcon className={styles.icon} />
                    </button>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <h4 className={styles.cardTitle}>{d.partName}</h4>
                  <div className={styles.cardInfo}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Материал:</span>
                      <span>{d.materialName}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Артикул материала:</span>
                      <span className={styles.materialSku}>{d.materialSku}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Толщина:</span>
                      <span>{d.thickness ?? '–'}</span>
                    </div>
                    {d.thicknessWithEdging && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Толщина с облицовкой:</span>
                        <span>{d.thicknessWithEdging}</span>
                      </div>
                    )}
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Размеры L×W:</span>
                      <span>
                        {d.finishedLength && d.finishedWidth 
                          ? `${d.finishedLength}×${d.finishedWidth}` 
                          : '–'
                        }
                      </span>
                    </div>
                    {d.groove && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Паз:</span>
                        <span>{d.groove}</span>
                      </div>
                    )}
                    {d.pfSku && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Артикул ПФ:</span>
                        <span>{d.pfSku}</span>
                      </div>
                    )}
                    {d.sbPartSku && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Артикул СБ детали:</span>
                        <span>{d.sbPartSku}</span>
                      </div>
                    )}
                    {d.conveyorPosition && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Подстопное место:</span>
                        <span>{d.conveyorPosition}</span>
                      </div>
                    )}
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Количество:</span>
                      <span className={styles.quantityBadge}>{d.quantity}</span>
                    </div>
                  </div>
                  <div className={styles.cardBadges}>
                    <span className={`${styles.badge} ${d.pf ? styles.badgeYes : styles.badgeNo}`}>
                      ПФ: {d.pf ? 'Да' : 'Нет'}
                    </span>
                    <span className={`${styles.badge} ${d.sbPart ? styles.badgeYes : styles.badgeNo}`}>
                      СБ: {d.sbPart ? 'Да' : 'Нет'}
                    </span>
                    <span className={`${styles.badge} ${d.pfSb ? styles.badgeYes : styles.badgeNo}`}>
                      ПФ СБ: {d.pfSb ? 'Да' : 'Нет'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальные окна */}
      <DetailModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateDetail}
        isLoading={isCreating}
        title="Создать деталь"
      />

      <DetailModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDetail(null);
        }}
        onSubmit={handleEditDetail}
        detail={selectedDetail}
        isLoading={isUpdating}
        title="Редактировать деталь"
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDetail(null);
        }}
        onConfirm={handleDeleteDetail}
        detail={selectedDetail}
        isLoading={isDeleting}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleFileUpload}
        isLoading={isUploading}
      />

      <ParsedDataModal
        isOpen={showParsedDataModal}
        onClose={() => {
          setShowParsedDataModal(false);
          clearAfterSave(); // Очищаем данные парсера при закрытии модального окна
        }}
        onSave={handleSaveParsedData}
        parsedData={parsedData}
        isLoading={isCreating}
      />
    </div>
  );
};
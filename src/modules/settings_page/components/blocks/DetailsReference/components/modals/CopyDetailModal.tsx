import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Detail, CreateDetailWithPackageDto, Route } from '../../../../../../api/detailsApi/detailsApi';
import styles from './DetailModal.module.css';

interface Package {
  packageId: number;
  packageCode: string;
  packageName: string;
}

interface CopyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDetailWithPackageDto) => Promise<void>;
  detail: Detail | null;
  packages: Package[];
  currentPackageId?: number;
  isLoading?: boolean;
  routes: Route[];
  routesLoading?: boolean;
}

export const CopyDetailModal: React.FC<CopyDetailModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  detail,
  packages,
  currentPackageId,
  isLoading = false,
  routes,
  routesLoading = false
}) => {
  const [formData, setFormData] = useState<CreateDetailWithPackageDto>({
    partSku: '',
    partName: '',
    materialName: '',
    materialSku: '',
    thickness: undefined,
    thicknessWithEdging: undefined,
    finishedLength: undefined,
    finishedWidth: undefined,
    groove: '',
    edgingSkuL1: '',
    edgingNameL1: '',
    edgingSkuL2: '',
    edgingNameL2: '',
    edgingSkuW1: '',
    edgingNameW1: '',
    edgingSkuW2: '',
    edgingNameW2: '',
    plasticFace: '',
    plasticFaceSku: '',
    plasticBack: '',
    plasticBackSku: '',
    pf: false,
    pfSku: '',
    sbPart: false,
    pfSb: false,
    sbPartSku: '',
    conveyorPosition: '',
    quantity: 1,
    routeId: 0,
    packageId: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userModifiedRoute, setUserModifiedRoute] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  useEffect(() => {
    if (detail && isOpen) {
      // Получаем routeId из packageDetails для текущей упаковки
      const currentPackageDetail = detail.packageDetails?.find(pd => pd.packageId === currentPackageId);
      const routeId = currentPackageDetail?.route?.routeId || detail.route?.routeId || 0;
      
      setFormData({
        partSku: `${detail.partSku}`,
        partName: detail.partName,
        materialName: detail.materialName,
        materialSku: detail.materialSku,
        thickness: detail.thickness,
        thicknessWithEdging: detail.thicknessWithEdging,
        finishedLength: detail.finishedLength,
        finishedWidth: detail.finishedWidth,
        groove: detail.groove || '',
        edgingSkuL1: detail.edgingSkuL1 || '',
        edgingNameL1: detail.edgingNameL1 || '',
        edgingSkuL2: detail.edgingSkuL2 || '',
        edgingNameL2: detail.edgingNameL2 || '',
        edgingSkuW1: detail.edgingSkuW1 || '',
        edgingNameW1: detail.edgingNameW1 || '',
        edgingSkuW2: detail.edgingSkuW2 || '',
        edgingNameW2: detail.edgingNameW2 || '',
        plasticFace: detail.plasticFace || '',
        plasticFaceSku: detail.plasticFaceSku || '',
        plasticBack: detail.plasticBack || '',
        plasticBackSku: detail.plasticBackSku || '',
        pf: detail.pf,
        pfSku: detail.pfSku || '',
        sbPart: detail.sbPart,
        pfSb: detail.pfSb,
        sbPartSku: detail.sbPartSku || '',
        conveyorPosition: detail.conveyorPosition || '',
        quantity: currentPackageDetail?.quantity || detail.quantity || 1,
        routeId: routeId,
        packageId: currentPackageId || 0,
      });
      setUserModifiedRoute(false);
    }
    setErrors({});
    setServerError('');
  }, [detail, isOpen, currentPackageId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.partSku.trim()) {
      newErrors.partSku = 'Артикул детали обязателен';
    }
    if (!formData.partName.trim()) {
      newErrors.partName = 'Наименование детали обязательно';
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Количество должно быть больше 0';
    }
    if (!formData.routeId || formData.routeId === 0) {
      newErrors.routeId = 'Маршрут обязателен для выбора';
    }
    if (!formData.packageId || formData.packageId === 0) {
      newErrors.packageId = 'Упаковка обязательна для выбора';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setServerError('');
    try {
      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Ошибка при копировании детали';
      setServerError(message);
      console.error('Ошибка при копировании детали:', error);
    }
  };

  const handleInputChange = (field: keyof CreateDetailWithPackageDto, value: any) => {
    if (field === 'routeId') {
      setUserModifiedRoute(true);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Копировать деталь</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <XMarkIcon className={styles.icon} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Выбор упаковки */}
            <div className={styles.section}>
              <h3>Упаковка</h3>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label>Упаковка *</label>
                  <select
                    value={formData.packageId}
                    onChange={e => handleInputChange('packageId', parseInt(e.target.value))}
                    className={`${styles.input} ${errors.packageId ? styles.error : ''}`}
                  >
                    <option value={0}>Выберите упаковку</option>
                    {packages.map(pkg => (
                      <option key={pkg.packageId} value={pkg.packageId}>
                        {pkg.packageCode} - {pkg.packageName}
                      </option>
                    ))}
                  </select>
                  {errors.packageId && <span className={styles.errorText}>{errors.packageId}</span>}
                </div>
              </div>
            </div>

            {/* Основная информация */}
            <div className={styles.section}>
              <h3>Основная информация</h3>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label>Артикул детали *</label>
                  <input
                    type="text"
                    value={formData.partSku}
                    onChange={e => handleInputChange('partSku', e.target.value)}
                    className={`${styles.input} ${errors.partSku ? styles.error : ''}`}
                    placeholder="Введите артикул детали"
                  />
                  {errors.partSku && <span className={styles.errorText}>{errors.partSku}</span>}
                </div>

                <div className={styles.field}>
                  <label>Наименование детали *</label>
                  <input
                    type="text"
                    value={formData.partName}
                    onChange={e => handleInputChange('partName', e.target.value)}
                    className={`${styles.input} ${errors.partName ? styles.error : ''}`}
                    placeholder="Введите наименование детали"
                  />
                  {errors.partName && <span className={styles.errorText}>{errors.partName}</span>}
                </div>

                <div className={styles.field}>
                  <label>Наименование материала</label>
                  <input
                    type="text"
                    value={formData.materialName}
                    onChange={e => handleInputChange('materialName', e.target.value)}
                    className={`${styles.input} ${errors.materialName ? styles.error : ''}`}
                    placeholder="Введите наименование материала"
                  />
                  {errors.materialName && <span className={styles.errorText}>{errors.materialName}</span>}
                </div>

                <div className={styles.field}>
                  <label>Артикул материала</label>
                  <input
                    type="text"
                    value={formData.materialSku}
                    onChange={e => handleInputChange('materialSku', e.target.value)}
                    className={`${styles.input} ${errors.materialSku ? styles.error : ''}`}
                    placeholder="Введите артикул материала"
                  />
                  {errors.materialSku && <span className={styles.errorText}>{errors.materialSku}</span>}
                </div>

                <div className={styles.field}>
                  <label>Количество *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.quantity}
                    onChange={e => handleInputChange('quantity', e.target.value ? parseFloat(e.target.value) : '')}
                    className={`${styles.input} ${errors.quantity ? styles.error : ''}`}
                    placeholder="Введите количество"
                  />
                  {errors.quantity && <span className={styles.errorText}>{errors.quantity}</span>}
                </div>

                <div className={styles.field}>
                  <label>Маршрут *</label>
                  <select
                    value={formData.routeId}
                    onChange={e => handleInputChange('routeId', parseInt(e.target.value))}
                    onClick={() => setUserModifiedRoute(true)}
                    className={`${styles.input} ${
                      errors.routeId 
                        ? styles.error 
                        : !userModifiedRoute && formData.routeId 
                          ? styles.inputAuto 
                          : ''
                    }`}
                    disabled={routesLoading}
                  >
                    <option value={0}>Выберите маршрут</option>
                    {routes.map(route => (
                      <option key={route.routeId} value={route.routeId}>
                        {route.routeName}
                      </option>
                    ))}
                  </select>
                  {errors.routeId && <span className={styles.errorText}>{errors.routeId}</span>}
                </div>
              </div>
            </div>

            {/* Размеры */}
            <div className={styles.section}>
              <h3>Размеры</h3>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label>Толщина</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.thickness || ''}
                    onChange={e => handleInputChange('thickness', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={styles.input}
                    placeholder="0.0"
                  />
                </div>

                <div className={styles.field}>
                  <label>Толщина с облицовкой</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.thicknessWithEdging || ''}
                    onChange={e => handleInputChange('thicknessWithEdging', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={styles.input}
                    placeholder="0.0"
                  />
                </div>

                <div className={styles.field}>
                  <label>Готовая деталь [L]</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.finishedLength || ''}
                    onChange={e => handleInputChange('finishedLength', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={styles.input}
                    placeholder="0.0"
                  />
                </div>

                <div className={styles.field}>
                  <label>Готовая деталь [W]</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.finishedWidth || ''}
                    onChange={e => handleInputChange('finishedWidth', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={styles.input}
                    placeholder="0.0"
                  />
                </div>

                <div className={styles.field}>
                  <label>Паз</label>
                  <input
                    type="text"
                    value={formData.groove}
                    onChange={e => handleInputChange('groove', e.target.value)}
                    className={styles.input}
                    placeholder="Введите информацию о пазе"
                  />
                </div>

                <div className={styles.field}>
                  <label>Подстопное место</label>
                  <input
                    type="text"
                    value={formData.conveyorPosition || ''}
                    onChange={e => handleInputChange('conveyorPosition', e.target.value || '')}
                    className={styles.input}
                    placeholder="Введите подстопное место"
                  />
                </div>
              </div>
            </div>

            {/* Кромки */}
            <div className={styles.section}>
              <h3>Кромки</h3>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label>Артикул кромки L1</label>
                  <input
                    type="text"
                    value={formData.edgingSkuL1}
                    onChange={e => handleInputChange('edgingSkuL1', e.target.value)}
                    className={styles.input}
                    placeholder="Артикул кромки L1"
                  />
                </div>

                <div className={styles.field}>
                  <label>Обозначение облицовки кромки L1</label>
                  <input
                    type="text"
                    value={formData.edgingNameL1}
                    onChange={e => handleInputChange('edgingNameL1', e.target.value)}
                    className={styles.input}
                    placeholder="Обозначение облицовки кромки L1"
                  />
                </div>

                <div className={styles.field}>
                  <label>Артикул кромки L2</label>
                  <input
                    type="text"
                    value={formData.edgingSkuL2}
                    onChange={e => handleInputChange('edgingSkuL2', e.target.value)}
                    className={styles.input}
                    placeholder="Артикул кромки L2"
                  />
                </div>

                <div className={styles.field}>
                  <label>Обозначение облицовки кромки L2</label>
                  <input
                    type="text"
                    value={formData.edgingNameL2}
                    onChange={e => handleInputChange('edgingNameL2', e.target.value)}
                    className={styles.input}
                    placeholder="Обозначение облицовки кромки L2"
                  />
                </div>

                <div className={styles.field}>
                  <label>Артикул кромки W1</label>
                  <input
                    type="text"
                    value={formData.edgingSkuW1}
                    onChange={e => handleInputChange('edgingSkuW1', e.target.value)}
                    className={styles.input}
                    placeholder="Артикул кромки W1"
                  />
                </div>

                <div className={styles.field}>
                  <label>Обозначение облицовки кромки W1</label>
                  <input
                    type="text"
                    value={formData.edgingNameW1}
                    onChange={e => handleInputChange('edgingNameW1', e.target.value)}
                    className={styles.input}
                    placeholder="Обозначение облицовки кромки W1"
                  />
                </div>

                <div className={styles.field}>
                  <label>Артикул кромки W2</label>
                  <input
                    type="text"
                    value={formData.edgingSkuW2}
                    onChange={e => handleInputChange('edgingSkuW2', e.target.value)}
                    className={styles.input}
                    placeholder="Артикул кромки W2"
                  />
                </div>

                <div className={styles.field}>
                  <label>Обозначение облицовки кромки W2</label>
                  <input
                    type="text"
                    value={formData.edgingNameW2}
                    onChange={e => handleInputChange('edgingNameW2', e.target.value)}
                    className={styles.input}
                    placeholder="Обозначение облицовки кромки W2"
                  />
                </div>
              </div>
            </div>

            {/* Пластик */}
            <div className={styles.section}>
              <h3>Пластик</h3>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label>Пластик лицевой</label>
                  <input
                    type="text"
                    value={formData.plasticFace}
                    onChange={e => handleInputChange('plasticFace', e.target.value)}
                    className={styles.input}
                    placeholder="Пластик лицевой"
                  />
                </div>

                <div className={styles.field}>
                  <label>Артикул пластика лицевого</label>
                  <input
                    type="text"
                    value={formData.plasticFaceSku}
                    onChange={e => handleInputChange('plasticFaceSku', e.target.value)}
                    className={styles.input}
                    placeholder="Артикул пластика лицевого"
                  />
                </div>

                <div className={styles.field}>
                  <label>Пластик тыльный</label>
                  <input
                    type="text"
                    value={formData.plasticBack}
                    onChange={e => handleInputChange('plasticBack', e.target.value)}
                    className={styles.input}
                    placeholder="Пластик тыльный"
                  />
                </div>

                <div className={styles.field}>
                  <label>Артикул пластика тыльного</label>
                  <input
                    type="text"
                    value={formData.plasticBackSku}
                    onChange={e => handleInputChange('plasticBackSku', e.target.value)}
                    className={styles.input}
                    placeholder="Артикул пластика тыльного"
                  />
                </div>
              </div>
            </div>

            {/* Дополнительные параметры */}
            <div className={styles.section}>
              <h3>Дополнительные параметры</h3>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.pf}
                      onChange={e => handleInputChange('pf', e.target.checked)}
                      className={styles.checkbox}
                    />
                    ПФ
                  </label>
                </div>

                <div className={styles.field}>
                  <label>Артикул ПФ</label>
                  <input
                    type="text"
                    value={formData.pfSku}
                    onChange={e => handleInputChange('pfSku', e.target.value)}
                    className={styles.input}
                    placeholder="Артикул ПФ"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.sbPart}
                      onChange={e => handleInputChange('sbPart', e.target.checked)}
                      className={styles.checkbox}
                    />
                    СБ деталь
                  </label>
                </div>

                <div className={styles.field}>
                  <label>Артикул СБ детали</label>
                  <input
                    type="text"
                    value={formData.sbPartSku}
                    onChange={e => handleInputChange('sbPartSku', e.target.value)}
                    className={styles.input}
                    placeholder="Артикул СБ детали"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.pfSb}
                      onChange={e => handleInputChange('pfSb', e.target.checked)}
                      className={styles.checkbox}
                    />
                    ПФ СБ
                  </label>
                </div>
              </div>
            </div>
          </div>

          {serverError && (
            <div className={styles.serverError}>
              <ExclamationTriangleIcon className={styles.errorIcon} />
              <span>{serverError}</span>
            </div>
          )}

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner}></div>
                  Копирование...
                </>
              ) : (
                <>
                  <CheckIcon className={styles.icon} />
                  Копировать
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

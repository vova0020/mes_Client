import React, { memo } from 'react';
import styles from './ProductionReport.module.css';
import { MachineProductionRecord } from '../../../../api/orderManagementApi/defectStatisticsApi';

interface ProductionTableRowProps {
  record: MachineProductionRecord;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  formatDuration: (seconds: number) => string;
}

const ProductionTableRow: React.FC<ProductionTableRowProps> = memo(({ 
  record, 
  formatDate, 
  formatTime, 
  formatDuration 
}) => {
  return (
    <tr>
      <td className={styles.tdProdDate}>
        <div className={styles.dateCell}>
          <span className={styles.prodDateStart}>
            {formatDate(record.startedAt)} {formatTime(record.startedAt)}
          </span>
          <span className={styles.prodDateEnd}>
            → {formatDate(record.completedAt)} {formatTime(record.completedAt)}
          </span>
        </div>
      </td>
      <td className={styles.tdProdMachine}>
        <div className={styles.cellContent}>
          <div className={styles.cellMain}>{record.machineName}</div>
          <div className={styles.cellSub}>{record.stageName}</div>
        </div>
      </td>
      <td className={styles.tdProdOrder}>
        {record.packages.length > 0 ? (
          <div className={styles.packagesCell}>
            {record.packages.map((pkg, idx) => (
              <div key={pkg.packageId} className={styles.packageItem}>
                {idx === 0 && (
                  <>
                    <div className={styles.cellMain}>№ {pkg.orderBatchNumber}</div>
                    <div className={styles.cellSub}>{pkg.orderName}</div>
                  </>
                )}
                <div className={styles.cellSub}>
                  📦 {pkg.packageName} ({pkg.packageCode})
                </div>
              </div>
            ))}
          </div>
        ) : '-'}
      </td>
      <td className={styles.tdProdPart}>
        <div className={styles.cellContent}>
          <div className={styles.cellMain}>{record.partCode}</div>
          <div className={styles.cellSub}>{record.partName}</div>
          {record.partSize && (
            <div className={styles.cellSub}>{record.partSize}</div>
          )}
        </div>
      </td>
      <td className={styles.tdProdMaterial}>
        {record.materialName ? (
          <div className={styles.cellContent}>
            <div className={styles.cellMain}>{record.materialName}</div>
            <div className={styles.cellSub}>{record.materialSku}</div>
          </div>
        ) : '-'}
      </td>
      <td className={styles.tdProdPallet}>
        <div className={styles.cellContent}>
          <div className={styles.cellMain}>{record.palletName}</div>
        </div>
      </td>
      <td className={styles.tdProdQty}>
        <div className={styles.prodQtyCell}>
          <span className={styles.prodQtyBadge}>
            {record.quantityProcessed}
          </span>
        </div>
      </td>
      <td className={styles.tdProdDuration}>
        <span className={styles.durationBadge}>
          {formatDuration(record.durationSeconds)}
        </span>
      </td>
    </tr>
  );
});

ProductionTableRow.displayName = 'ProductionTableRow';

export default ProductionTableRow;

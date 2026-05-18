import React from 'react';
import styles from './InternalReclamations.module.css';
import { UnreturnedDefectRecord } from '../../../../api/orderManagementApi/unreturnedDefectsApi';

interface ReclamationTableRowProps {
  record: UnreturnedDefectRecord;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
}

const ReclamationTableRow: React.FC<ReclamationTableRowProps> = ({
  record,
  formatDate,
  formatTime,
}) => {
  return (
    <tr>
      <td className={styles.tdDate}>
        <div className={styles.dateCell}>
          <div className={styles.cellMain}>{formatDate(record.detectedAt)}</div>
          <div className={styles.timeCell}>{formatTime(record.detectedAt)}</div>
        </div>
      </td>
      <td className={styles.tdOrder}>
        <div className={styles.cellContent}>
          <div className={styles.cellMain}>{record.orderBatchNumber}</div>
          <div className={styles.cellSub}>{record.orderName}</div>
        </div>
      </td>
      <td className={styles.tdPackage}>
        <div className={styles.cellContent}>
          <div className={styles.cellMain}>{record.packageCode}</div>
          <div className={styles.cellSub}>{record.packageName}</div>
        </div>
      </td>
      <td className={styles.tdPart}>
        <div className={styles.cellContent}>
          <div className={styles.cellMain}>{record.partCode}</div>
          <div className={styles.cellSub}>{record.partName}</div>
        </div>
      </td>
      <td className={styles.tdSize}>
        <div className={styles.sizeCell}>{record.partSize || '—'}</div>
      </td>
      <td className={styles.tdMaterial}>
        <div className={styles.cellContent}>
          {record.materialName ? (
            <>
              <div className={styles.cellMain}>{record.materialName}</div>
              {record.materialSku && (
                <div className={styles.cellSub}>{record.materialSku}</div>
              )}
            </>
          ) : (
            <div className={styles.noData}>—</div>
          )}
        </div>
      </td>
      <td className={styles.tdQty}>
        <div className={styles.qtyCell}>
          <span className={styles.qtyBadge}>{record.unreturnedQuantity}</span>
        </div>
      </td>
    </tr>
  );
};

export default ReclamationTableRow;

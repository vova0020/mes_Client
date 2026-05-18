import React, { memo } from 'react';
import styles from './DefectAnalysis.module.css';
import { DefectDetail } from '../../../../api/orderManagementApi/defectStatisticsApi';

interface DefectTableRowProps {
  record: DefectDetail;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
}

const DefectTableRow: React.FC<DefectTableRowProps> = memo(({ record, formatDate, formatTime }) => {
  return (
    <tr>
      <td className={styles.tdDate}>
        <div className={styles.dateCell}>
          {formatDate(record.detectedAt)}
          <span className={styles.timeCell}>
            {formatTime(record.detectedAt)}
          </span>
        </div>
      </td>
      <td className={styles.tdOrder}>
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
      <td className={styles.tdPart}>
        <div className={styles.cellContent}>
          <div className={styles.cellMain}>{record.partCode}</div>
          <div className={styles.cellSub}>{record.partName}</div>
        </div>
      </td>
      <td className={styles.tdMaterial}>
        {record.materialName ? (
          <div className={styles.cellContent}>
            <div className={styles.cellMain}>{record.materialName}</div>
            <div className={styles.cellSub}>{record.materialSku}</div>
          </div>
        ) : '-'}
      </td>
      <td className={styles.tdQty}>
        <div className={styles.qtyCell}>
          <span className={styles.defectBadge}>{record.defectQuantity}</span>
        </div>
      </td>
      <td className={styles.tdStage}>
        <div className={styles.cellContent}>
          <div className={styles.cellMain}>{record.stageName}</div>
          {record.machineName && (
            <div className={styles.cellSub}>{record.machineName}</div>
          )}
        </div>
      </td>
      <td className={styles.tdWorker}>{record.reportedByName || '-'}</td>
      <td className={styles.tdReturn}>
        {record.returnEvents.length > 0 ? (
          <div className={styles.returnCell}>
            <div className={styles.returnHeader}>
              <span className={styles.returnBadge}>
                ✓ Возвращено: {record.totalReturnedQuantity} шт.
              </span>
              {record.returnEvents.length > 1 && (
                <span className={styles.returnCount}>
                  {record.returnEvents.length}{' '}
                  {record.returnEvents.length < 5 ? 'возврата' : 'возвратов'}
                </span>
              )}
            </div>
            <div className={styles.returnEventsList}>
              {record.returnEvents.map((event) => (
                <div key={event.movementId} className={styles.returnEvent}>
                  <div className={styles.returnEventLine}>
                    <span className={styles.returnEventQty}>{event.returnedQuantity} шт.</span>
                    <span className={styles.returnEventDate}>{formatDate(event.returnedAt)}</span>
                  </div>
                  <div className={styles.returnEventStage}>
                    → {event.returnToStageName || 'Не указан'}
                  </div>
                  {(event.returnToMachineName || event.returnPalletName) && (
                    <div className={styles.returnEventDetails}>
                      {event.returnToMachineName && <span>⚙️ {event.returnToMachineName}</span>}
                      {event.returnPalletName && <span>📦 {event.returnPalletName}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <span className={styles.noReturn}>—</span>
        )}
      </td>
      <td className={styles.tdNote}>
        <div className={styles.noteCell}>{record.note || '—'}</div>
      </td>
    </tr>
  );
});

DefectTableRow.displayName = 'DefectTableRow';

export default DefectTableRow;

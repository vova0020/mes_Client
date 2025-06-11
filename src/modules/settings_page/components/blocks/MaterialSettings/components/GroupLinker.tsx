// ================================================
// src/modules/materials/components/GroupLinker.tsx
// ================================================
import React, { useState } from 'react';
import { linkMaterialToGroup, unlinkMaterialFromGroup } from '../api';
import styles from '../MaterialSettings.module.css';

export const GroupLinker: React.FC = () => {
  const [gid, setGid] = useState<number>();
  const [mid, setMid] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleLink = async () => {
    if (!gid || !mid) {
      setMessage('Введите ID группы и материала');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await linkMaterialToGroup({ groupId: gid, materialId: mid });
      setMessage('Материал успешно привязан к группе');
      setGid(undefined);
      setMid(undefined);
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.message || 'Ошибка при привязке');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!gid || !mid) {
      setMessage('Введите ID группы и материала');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await unlinkMaterialFromGroup({ groupId: gid, materialId: mid });
      setMessage('Материал успешно отвязан от группы');
      setGid(undefined);
      setMid(undefined);
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.message || 'Ошибка при отвязке');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGid(value ? +value : undefined);
    setMessage('');
  };

  const handleMaterialIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMid(value ? +value : undefined);
    setMessage('');
  };

  return (
    <div className={`${styles.componentBlock} ${styles.groupLinkerContainer}`}>
      <div className={styles.blockHeader}>
        <h2 className={styles.blockTitle}>Привязать / Отвязать</h2>
      </div>
      <div className={styles.blockContent}>
        <div className={styles.groupLinkerForm}>
          <input
            type="number"
            placeholder="ID группы"
            value={gid || ''}
            onChange={handleGroupIdChange}
            className={`${styles.formInput} ${styles.groupLinkerInput}`}
            disabled={loading}
            min="1"
            aria-label="ID группы"
          />
          <input
            type="number"
            placeholder="ID материала"
            value={mid || ''}
            onChange={handleMaterialIdChange}
            className={`${styles.formInput} ${styles.groupLinkerInput}`}
            disabled={loading}
            min="1"
            aria-label="ID материала"
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={handleLink}
            disabled={loading || !gid || !mid}
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonMedium}`}
          >
            {loading ? 'Привязываю...' : 'Привязать'}
          </button>
          <button
            onClick={handleUnlink}
            disabled={loading || !gid || !mid}
            className={`${styles.button} ${styles.buttonWarning} ${styles.buttonMedium}`}
          >
            {loading ? 'Отвязываю...' : 'Отвязать'}
          </button>
        </div>

        {message && (
          <div className={`${styles.errorContainer} ${message.includes('успешно') ? styles.successContainer : ''}`}>
            <p className={`${styles.errorText} ${message.includes('успешно') ? styles.successText : ''}`}>
              {message}
            </p>
          </div>
        )}

        <div className={styles.formGroup}>
          <p className={styles.listItemSubtitle}>
            Введите ID группы и материала для связывания или разрыва связи между ними.
          </p>
        </div>
      </div>
    </div>
  );
};
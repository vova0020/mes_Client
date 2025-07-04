// SeriesSection.tsx
import React, { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import styles from './SeriesSection.module.css'

interface Series {
  id: string
  name: string
  isExpanded: boolean
}

interface SeriesSectionProps {
  series: Series[]
  onAddSeries: (name: string) => void
  onToggleSeries: (seriesId: string) => void
  onExpandAll?: () => void
  selectedSeriesId: string | null
}

export const SeriesSection: React.FC<SeriesSectionProps> = ({
  series,
  onAddSeries,
  onToggleSeries,
  onExpandAll,
  selectedSeriesId,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    if (newName.trim()) {
      onAddSeries(newName.trim())
      setNewName('')
      setIsAddingNew(false)
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3>СЕРИЯ</h3>
      </div>

      <div className={styles.content}>
        {series.length > 0 ? (
          <table className={styles.table}>
            <tbody>
              {series.map((s, idx) => (
                <tr
                  key={s.id}
                  className={
                    selectedSeriesId === s.id
                      ? styles.rowSelected
                      : idx % 2 === 0
                      ? undefined
                      : styles.rowAlt
                  }
                  onClick={() => onToggleSeries(s.id)}
                >
                  <td className={styles.cellIcon}>
                    {s.isExpanded ? (
                      <ChevronDownIcon className={styles.icon} />
                    ) : (
                      <ChevronRightIcon className={styles.icon} />
                    )}
                  </td>
                  <td className={styles.cellName}>{s.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.empty}>
            <p>Нет созданных серий</p>
            <p className={styles.hint}>Добавьте первую серию для начала работы</p>
          </div>
        )}

        {isAddingNew && (
          <div className={styles.addForm}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Название серии"
              className={styles.input}
              autoFocus
            />
            <div className={styles.addFormActions}>
              <button onClick={handleAdd} className={styles.btnPrimary}>
                Сохранить
              </button>
              <button
                onClick={() => {
                  setIsAddingNew(false)
                  setNewName('')
                }}
                className={styles.btnSecondary}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button
          onClick={onExpandAll}
          className={styles.btnSecondary}
          disabled={!onExpandAll}
        >
          Развернуть список
        </button>
        <button
          onClick={() => setIsAddingNew(true)}
          className={styles.btnPrimary}
          disabled={isAddingNew}
        >
          <PlusIcon className={styles.plusIcon} />
          Добавить запись
        </button>
      </div>
    </div>
  )
}

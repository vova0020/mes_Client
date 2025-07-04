// ProductSection.tsx
import React, { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import styles from './ProductSection.module.css'

interface Product {
  id: string
  seriesId: string
  name: string
  isExpanded: boolean
}

interface ProductSectionProps {
  products: Product[]
  selectedSeriesId: string | null
  onAddProduct: (seriesId: string, name: string) => void
  onToggleProduct: (productId: string) => void
  selectedProductId: string | null
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  selectedSeriesId,
  onAddProduct,
  onToggleProduct,
  selectedProductId,
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    if (newName.trim() && selectedSeriesId) {
      onAddProduct(selectedSeriesId, newName.trim())
      setNewName('')
      setIsAdding(false)
    }
  }

  const canAdd = selectedSeriesId !== null

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3>ИЗДЕЛИЯ</h3>
        <button
          className={styles.btnPrimary}
          onClick={() => setIsAdding(true)}
          disabled={isAdding || !canAdd}
          title={!canAdd ? 'Выберите серию для добавления изделия' : ''}
        >
          <PlusIcon className={styles.plusIcon} />
          Добавить
        </button>
      </div>

      <div className={styles.content}>
        {!selectedSeriesId && (
          <div className={styles.empty}>
            <p>Выберите серию</p>
            <p className={styles.hint}>
              Для просмотра изделий выберите серию в левом блоке
            </p>
          </div>
        )}

        {selectedSeriesId && (
          <>
            {isAdding && (
              <div className={styles.addForm}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Название изделия"
                  className={styles.input}
                  autoFocus
                />
                <div className={styles.addFormActions}>
                  <button onClick={handleAdd} className={styles.btnPrimary}>
                    Сохранить
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false)
                      setNewName('')
                    }}
                    className={styles.btnSecondary}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {products.length > 0 ? (
              <table className={styles.table}>
                <tbody>
                  {products.map((p, i) => (
                    <tr
                      key={p.id}
                      className={
                        selectedProductId === p.id
                          ? styles.rowSelected
                          : i % 2 === 1
                          ? styles.rowAlt
                          : undefined
                      }
                      onClick={() => onToggleProduct(p.id)}
                    >
                      <td className={styles.cellIcon}>
                        {p.isExpanded ? (
                          <ChevronDownIcon className={styles.icon} />
                        ) : (
                          <ChevronRightIcon className={styles.icon} />
                        )}
                      </td>
                      <td className={styles.cellName}>{p.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : !isAdding ? (
              <div className={styles.empty}>
                <p>Нет изделий в этой серии</p>
                <p className={styles.hint}>Добавьте первое изделие</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
)
}

import React, { useState } from 'react'
import { PlusIcon, DocumentIcon, MapIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import styles from './PackagingSection.module.css'
import { PackagingModal } from './PackagingModal'

interface Packaging {
  id: string
  article: string
  name: string
  detailsCount: number
}

interface PackagingSectionProps {
  packaging: Packaging[]
  onAddPackaging: (article: string, name: string) => Promise<void>
  onEditPackaging?: (packagingId: string, article: string, name: string) => Promise<void>
  onDeletePackaging?: (packagingId: string) => Promise<void>
  onSelectPackaging?: (packagingId: string) => void
  selectedPackagingId?: string | null
}

export const PackagingSection: React.FC<PackagingSectionProps> = ({
  packaging,
  onAddPackaging,
  onEditPackaging,
  onDeletePackaging,
  onSelectPackaging,
  selectedPackagingId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddPackaging = async (article: string, name: string) => {
    setIsLoading(true)
    try {
      await onAddPackaging(article, name)
      setIsModalOpen(false) // Закрываем модальное окно после успешного сохранения
    } catch (error) {
      console.error('Ошибка при добавлении упаковки:', error)
      // Не закрываем окно при ошибке, чтобы пользователь мог попробовать снова
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneralLayoutSchema = (packagingId: string) => {
    console.log('Открыть общую схему укладки для упаковки:', packagingId)
  }

  const handlePostLayoutSchema = (packagingId: string) => {
    console.log('Открыть схему укладки по постам для упаковки:', packagingId)
  }

  const handleSelectPackaging = (packagingId: string) => {
    onSelectPackaging?.(packagingId)
  }

  return (
    <div className={styles.section}>
      <header className={styles.header}>
        <h3>Упаковка</h3>
      </header>

      <div className={styles.content}>
        {packaging.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Артикул</th>
                  <th>Название упаковки</th>
                  <th>Внесено деталей</th>
                  <th>Схемы укладки</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {packaging.map((pack) => (
                  <tr
                    key={pack.id}
                    className={`${styles.tableRow} ${
                      selectedPackagingId === pack.id ? styles.selectedRow : ''
                    }`}
                    onClick={() => handleSelectPackaging(pack.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelectPackaging(pack.id)
                      }
                    }}
                  >
                    <td className={styles.articleCell}>
                      <span className={styles.articleBadge}>{pack.article}</span>
                    </td>
                    <td className={styles.nameCell}>
                      <span className={styles.packagingName}>{pack.name}</span>
                    </td>
                    <td className={styles.countCell}>
                      {pack.detailsCount > 0 ? (
                        <span className={styles.countBadge}>
                          {pack.detailsCount}
                        </span>
                      ) : (
                        <span className={styles.countBadgeZero}>
                          {pack.detailsCount}
                        </span>
                      )}
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGeneralLayoutSchema(pack.id)
                          }}
                          title="Схема укладки общая"
                          className={styles.iconButton}
                          aria-label="Схема укладки общая"
                        >
                          <DocumentIcon className={styles.icon} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePostLayoutSchema(pack.id)
                          }}
                          title="Схема укладки по постам"
                          className={styles.iconButton}
                          aria-label="Схема укладки по постам"
                        >
                          <MapIcon className={styles.icon} />
                        </button>
                      </div>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPackaging?.(pack.id, pack.article, pack.name);
                          }}
                          title="Редактировать упаковку"
                          className={`${styles.iconButton} ${styles.editButton}`}
                          aria-label="Редактировать упаковку"
                        >
                          <PencilIcon className={styles.icon} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Подтверждение удаления
                            if (window.confirm('Вы уверены, что хотите удалить эту упаковку?')) {
                              onDeletePackaging?.(pack.id);
                            }
                          }}
                          title="Удалить упаковку"
                          className={`${styles.iconButton} ${styles.deleteButton}`}
                          aria-label="Удалить упаковку"
                        >
                          <TrashIcon className={styles.icon} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.empty}>
            <p>Нет созданных упаковок</p>
            <p className={styles.hint}>Добавьте первую упаковку для начала работы</p>
          </div>
        )}

        <footer className={styles.footer}>
          <button
            onClick={() => setIsModalOpen(true)}
            className={styles.addBtn}
          >
            <PlusIcon className={styles.icon} />
            Добавить упаковку
          </button>
        </footer>
      </div>

      <PackagingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddPackaging}
        isLoading={isLoading}
      />
    </div>
  )
}
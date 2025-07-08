import React, { useState, useRef, useEffect } from 'react'
import { PlusIcon, DocumentIcon, MapIcon, XMarkIcon } from '@heroicons/react/24/outline'
import styles from './PackagingSection.module.css'

interface Packaging {
  id: string
  article: string
  name: string
  detailsCount: number
}

interface PackagingSectionProps {
  packaging: Packaging[]
  onAddPackaging: (article: string, name: string) => void
  onSelectPackaging?: (packagingId: string) => void
  selectedPackagingId?: string | null
}

export const PackagingSection: React.FC<PackagingSectionProps> = ({
  packaging,
  onAddPackaging,
  onSelectPackaging,
  selectedPackagingId,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newPackagingData, setNewPackagingData] = useState({
    article: '',
    name: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ article?: string; name?: string }>({})
  const articleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAddingNew && articleInputRef.current) {
      articleInputRef.current.focus()
    }
  }, [isAddingNew])

  const validateForm = () => {
    const newErrors: { article?: string; name?: string } = {}
    
    if (!newPackagingData.article.trim()) {
      newErrors.article = 'Артикул обязателен'
    }
    
    if (!newPackagingData.name.trim()) {
      newErrors.name = 'Название обязательно'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  console.log(packaging);
  

  const handleAddPackaging = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      await onAddPackaging(
        newPackagingData.article.trim(),
        newPackagingData.name.trim()
      )
      setNewPackagingData({ article: '', name: '' })
      setErrors({})
      setIsAddingNew(false)
    } catch (error) {
      console.error('Ошибка при добавлении упаковки:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setNewPackagingData({ article: '', name: '' })
    setErrors({})
    setIsAddingNew(false)
  }

  const handleInputChange = (field: 'article' | 'name', value: string) => {
    setNewPackagingData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
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
        {!isAddingNew && (
        packaging.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Артикул</th>
                  <th>Название упаковки</th>
                  <th>Внесено деталей</th>
                  <th>Схемы укладки</th>
                </tr>
              </thead>
              <tbody>
                {packaging.map((pack) => (
                  <tr
                    key={pack.id}
                    className={`${styles.tableRow} ${
                      selectedPackagingId === pack.id
                        ? styles.selectedRow
                        : ''
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
                      {pack.detailsCount > 0 ? 
                      <span className={styles.countBadge}>
                        {pack.detailsCount}
                      </span> : 
                      <span className={styles.countBadgeZero}>
                        {pack.detailsCount}
                      </span>
                      }

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
        {packaging.length === 0 && !isAddingNew && (
          <div className={styles.empty}>
            <p>Нет созданных упаковок</p>
            <p className={styles.hint}>Добавьте первую упаковку для начала работы</p>
          </div>
        )}

        {isAddingNew && (
          <div className={styles.addForm}>
            <div className={styles.formHeader}>
              <h4 className={styles.formTitle}>Добавить новую упаковку</h4>
              <button
                onClick={handleCancel}
                className={styles.closeButton}
                aria-label="Закрыть форму"
              >
                <XMarkIcon className={styles.closeIcon} />
              </button>
            </div>
            
            <div className={styles.formFields}>
              <div className={styles.fieldGroup}>
                <label htmlFor="article-input" className={styles.label}>
                  Артикул упаковки *
                </label>
                <input
                  id="article-input"
                  ref={articleInputRef}
                  type="text"
                  placeholder="Введите артикул"
                  value={newPackagingData.article}
                  onChange={(e) => handleInputChange('article', e.target.value)}
                  className={`${styles.input} ${errors.article ? styles.inputError : ''}`}
                  disabled={isLoading}
                />
                {errors.article && (
                  <span className={styles.errorText}>{errors.article}</span>
                )}
              </div>
              
              <div className={styles.fieldGroup}>
                <label htmlFor="name-input" className={styles.label}>
                  Название упаковки *
                </label>
                <input
                  id="name-input"
                  type="text"
                  placeholder="Введите название"
                  value={newPackagingData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  disabled={isLoading}
                />
                {errors.name && (
                  <span className={styles.errorText}>{errors.name}</span>
                )}
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button 
                onClick={handleAddPackaging} 
                className={styles.btn}
                disabled={isLoading}
              >
                {isLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button 
                onClick={handleCancel} 
                className={styles.btnSecondary}
                disabled={isLoading}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        <footer className={styles.footer}>
          <button
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
            className={styles.addBtn}
          >
            <PlusIcon className={styles.icon} />
            Добавить упаковку
          </button>
        </footer>
      </div>
    </div>
  )
}
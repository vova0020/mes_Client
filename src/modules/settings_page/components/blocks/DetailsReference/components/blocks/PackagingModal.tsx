import React, { useEffect, useRef, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import styles from './PackagingSection.module.css'

interface PackagingModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (article: string, name: string) => Promise<void>
  isLoading: boolean
}

export const PackagingModal: React.FC<PackagingModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isLoading
}) => {
  const [packagingData, setPackagingData] = useState({
    article: '',
    name: '',
  })
  const [errors, setErrors] = useState<{ article?: string; name?: string }>({})
  const articleInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (isOpen && articleInputRef.current) {
      articleInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setPackagingData({ article: '', name: '' })
      setErrors({})
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: { article?: string; name?: string } = {}
    
    if (!packagingData.article.trim()) {
      newErrors.article = 'Артикул обязателен'
    }
    
    if (!packagingData.name.trim()) {
      newErrors.name = 'Название обязательно'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: 'article' | 'name', value: string) => {
    setPackagingData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      await onAdd(packagingData.article.trim(), packagingData.name.trim())
    } catch (error) {
      console.error('Ошибка при добавлении упаковки:', error)
      throw error // Пробрасываем ошибку выше
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.formHeader}>
          <h4 className={styles.formTitle}>Добавить новую упаковку</h4>
          <button
            onClick={onClose}
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
              value={packagingData.article}
              onChange={(e) => handleInputChange('article', e.target.value)}
              onKeyDown={handleKeyDown}
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
              value={packagingData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onKeyDown={handleKeyDown}
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
            onClick={handleSubmit} 
            className={styles.btn}
            disabled={isLoading}
          >
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button 
            onClick={onClose} 
            className={styles.btnSecondary}
            disabled={isLoading}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

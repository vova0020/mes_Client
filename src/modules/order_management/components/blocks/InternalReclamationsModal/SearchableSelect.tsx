import React, { useState, useRef, useEffect } from 'react';
import styles from './SearchableSelect.module.css';

interface Option {
  value: number | string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: number | string;
  onChange: (value: number | string) => void;
  placeholder?: string;
  label?: string;
  emptyText?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  label,
  emptyText = 'Нет доступных опций',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Фильтрация опций по поисковому запросу
  const filteredOptions = options.filter((option) => {
    const searchLower = searchTerm.toLowerCase();
    const labelMatch = option.label.toLowerCase().includes(searchLower);
    const subLabelMatch = option.subLabel?.toLowerCase().includes(searchLower);
    return labelMatch || subLabelMatch;
  });

  // Найти выбранную опцию
  const selectedOption = options.find((opt) => opt.value === value);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фокус на поле поиска при открытии
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const handleSelect = (optionValue: number | string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      
      <div className={styles.selectWrapper}>
        <div
          className={`${styles.selectHeader} ${isOpen ? styles.open : ''}`}
          onClick={handleToggle}
        >
          <span className={styles.selectedValue}>
            {selectedOption ? (
              <div className={styles.selectedContent}>
                <span className={styles.selectedLabel}>{selectedOption.label}</span>
                {selectedOption.subLabel && (
                  <span className={styles.selectedSubLabel}>{selectedOption.subLabel}</span>
                )}
              </div>
            ) : (
              <span className={styles.placeholder}>{placeholder}</span>
            )}
          </span>
          <div className={styles.actions}>
            {value && (
              <button
                className={styles.clearButton}
                onClick={handleClear}
                type="button"
              >
                ×
              </button>
            )}
            <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>▼</span>
          </div>
        </div>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.searchWrapper}>
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className={styles.optionsList}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`${styles.option} ${
                      option.value === value ? styles.selected : ''
                    }`}
                    onClick={() => handleSelect(option.value)}
                  >
                    <div className={styles.optionContent}>
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.subLabel && (
                        <span className={styles.optionSubLabel}>{option.subLabel}</span>
                      )}
                    </div>
                    {option.value === value && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>{emptyText}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;

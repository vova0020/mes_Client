import React from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import styles from './SearchAndSort.module.css';

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface SearchAndSortProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortConfig: SortConfig;
  onSortChange: (field: string) => void;
  searchPlaceholder?: string;
}

export const SearchAndSort: React.FC<SearchAndSortProps> = ({
  searchTerm,
  onSearchChange,
  sortConfig,
  onSortChange,
  searchPlaceholder = 'Поиск...'
}) => {
  return (
    <div className={styles.searchSortContainer}>
      <div className={styles.searchWrapper}>
        <MagnifyingGlassIcon className={styles.searchIcon} />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>
    </div>
  );
};

interface SortableHeaderProps {
  field: string;
  label: string;
  sortConfig: SortConfig;
  onSort: (field: string) => void;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  label,
  sortConfig,
  onSort
}) => {
  const isActive = sortConfig.field === field;
  
  return (
    <th onClick={() => onSort(field)} className={styles.sortable}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        {label}
        {isActive && (
          <ChevronDownIcon 
            className={`${styles.sortIcon} ${sortConfig.direction === 'desc' ? styles.rotated : ''}`} 
          />
        )}
      </span>
    </th>
  );
};
